import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { springSnappy } from '../lib/motion'

interface UpdateBannerProps {
  visible: boolean
  onRefresh: () => void | Promise<void>
  onDismiss: () => void
}

export function UpdateBanner({ visible, onRefresh, onDismiss }: UpdateBannerProps) {
  const reducedMotion = useReducedMotion()

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="alert"
          aria-live="assertive"
          initial={reducedMotion ? false : { opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reducedMotion ? undefined : { opacity: 0, y: -12 }}
          transition={springSnappy}
          className="viewport-fixed-top safe-top fixed inset-x-0 z-[60] px-gutter pb-2 pt-2"
        >
          <div className="mx-auto flex max-w-lg min-h-touch items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-separator bg-cream px-4 py-2.5 shadow-md dark:bg-surface-raised">
            <p className="min-w-0 flex-1 text-footnote font-medium text-ink dark:text-ink-dark">
              Update available
            </p>
            <div className="flex shrink-0 items-center gap-3">
              <button
                type="button"
                onClick={onDismiss}
                className="press-scale min-h-[36px] px-2 text-footnote font-medium text-warm-gray active:text-ink dark:text-warm-gray-light dark:active:text-ink-dark"
              >
                Later
              </button>
              <button
                type="button"
                onClick={() => void onRefresh()}
                className="press-scale min-h-[36px] text-footnote font-semibold text-sage active:text-sage-dark dark:text-sage-light"
              >
                Refresh
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
