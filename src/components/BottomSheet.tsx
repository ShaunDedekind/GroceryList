import { useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
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

  const requestClose = () => setVisible(false)

  return (
    <AnimatePresence onExitComplete={onClose}>
      {visible && (
        <div className="viewport-overlay z-50 flex items-end justify-center">
          <motion.button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-[var(--color-overlay)]"
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reducedMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={requestClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={reducedMotion ? false : { y: '100%' }}
            animate={{ y: 0 }}
            exit={reducedMotion ? undefined : { y: '100%' }}
            transition={springSnappy}
            className={`safe-bottom relative w-full max-w-lg overflow-y-auto rounded-sheet bg-cream px-[var(--spacing-sheet)] pb-6 pt-4 shadow-lg dark:bg-surface-raised ${maxHeightClass} ${className}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-9 shrink-0 rounded-full bg-cream-dark dark:bg-border-dark" />
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
