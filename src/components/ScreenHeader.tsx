import type { RefObject } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Icon } from './Icon'

interface TitleBlockProps {
  title: string
  subtitle: string
  onOpenSettings: () => void
  titleRef?: RefObject<HTMLDivElement | null>
}

export function LargeTitle({
  title,
  subtitle,
  onOpenSettings,
  titleRef,
}: TitleBlockProps) {
  return (
    <div ref={titleRef} className="safe-top px-gutter pb-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 py-1">
          <h1 className="text-large-title font-semibold text-ink dark:text-ink-dark">
            {title}
          </h1>
          <p className="mt-0.5 truncate text-footnote text-warm-gray dark:text-warm-gray-light">
            {subtitle || '\u00a0'}
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="Settings"
          className="hit-touch shrink-0 text-sage dark:text-sage-light"
        >
          <Icon name="settings" />
        </button>
      </div>
    </div>
  )
}

export function CompactTitleBar({
  title,
  visible,
  onOpenSettings,
}: {
  title: string
  visible: boolean
  onOpenSettings: () => void
}) {
  const reducedMotion = useReducedMotion()

  return (
    <motion.div
      className="absolute inset-x-0 top-0 z-20 border-b border-line bg-surface-strong backdrop-blur-xl"
      initial={false}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={reducedMotion ? { duration: 0 } : { duration: 0.2 }}
      style={{ pointerEvents: visible ? 'auto' : 'none' }}
      aria-hidden={!visible}
      inert={!visible}
    >
      <div className="safe-top">
        <div className="relative flex h-11 items-center justify-center px-gutter">
          <p className="truncate text-headline font-semibold text-ink dark:text-ink-dark">
            {title}
          </p>
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Settings"
            tabIndex={visible ? 0 : -1}
            className="hit-touch absolute right-1 text-sage dark:text-sage-light"
          >
            <Icon name="settings" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
