import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import {
  AnimatePresence,
  animate,
  motion,
  useDragControls,
  useMotionValue,
  useReducedMotion,
} from 'motion/react'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import { springSnappy } from '../lib/motion'

interface BottomSheetProps {
  onClose: () => void
  children: ReactNode
  maxHeightClass?: string
  className?: string
}

export function BottomSheet({
  onClose,
  children,
  maxHeightClass = '',
  className = '',
}: BottomSheetProps) {
  const reducedMotion = useReducedMotion()
  const [visible, setVisible] = useState(true)
  useBodyScrollLock(visible)
  const dragControls = useDragControls()
  const sheetRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [trigger] = useState<HTMLElement | null>(() => {
    if (typeof document === 'undefined') return null
    const active = document.activeElement
    return active instanceof HTMLElement ? active : null
  })
  const backdrop = useMotionValue(reducedMotion ? 1 : 0)

  const requestClose = () => setVisible(false)

  const finishClose = () => {
    onClose()
    trigger?.focus()
  }

  useEffect(() => {
    const sheet = sheetRef.current
    if (sheet && !sheet.contains(document.activeElement)) {
      sheet.focus()
    }
    const fade = animate(backdrop, 1, { duration: reducedMotion ? 0 : 0.2 })
    return () => fade.stop()
  }, [backdrop, reducedMotion])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return
      requestClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const startDrag = (event: PointerEvent<HTMLElement>) => {
    dragControls.start(event)
  }

  const startBodyDrag = (event: PointerEvent<HTMLDivElement>) => {
    const scroller = scrollRef.current
    if (!scroller || scroller.scrollTop > 0) return
    const target = event.target
    if (
      target instanceof Element &&
      target.closest('input, textarea, select, button, a')
    ) {
      return
    }
    dragControls.start(event)
  }

  return (
    <AnimatePresence onExitComplete={finishClose}>
      {visible && (
        <div className="viewport-overlay z-50 flex items-end justify-center">
          <motion.button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-[var(--color-overlay)]"
            style={{ opacity: backdrop }}
            onClick={requestClose}
          />
          <motion.div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            dragMomentum={false}
            initial={reducedMotion ? false : { y: '100%' }}
            animate={{ y: 0 }}
            exit={reducedMotion ? undefined : { y: '100%' }}
            transition={reducedMotion ? { duration: 0 } : springSnappy}
            onDrag={(_, info) => {
              const progress = Math.min(Math.max(info.offset.y, 0) / 240, 1)
              backdrop.set(1 - progress)
            }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 500) {
                requestClose()
                return
              }
              animate(backdrop, 1, reducedMotion ? { duration: 0 } : springSnappy)
            }}
            className={`safe-bottom relative flex w-full max-w-lg flex-col overflow-hidden rounded-sheet bg-cream shadow-lg outline-none dark:bg-surface-raised ${maxHeightClass} ${className}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Drag down to close"
              onPointerDown={startDrag}
              className="flex h-11 w-full shrink-0 touch-none items-center justify-center"
            >
              <span className="h-1 w-9 rounded-full bg-warm-gray-light" />
            </button>
            <div
              ref={scrollRef}
              onPointerDown={startBodyDrag}
              className="min-h-0 overflow-y-auto px-[var(--spacing-sheet)] pb-6"
            >
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
