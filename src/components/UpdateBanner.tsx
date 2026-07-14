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
          initial={reducedMotion ? false : { opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reducedMotion ? undefined : { opacity: 0, y: -16 }}
          transition={springSnappy}
          className="viewport-fixed-top safe-top fixed inset-x-0 z-[60] border-b border-sage-dark/30 bg-sage px-4 pb-3 pt-2 shadow-md"
        >
          <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
            <p className="min-w-0 flex-1 text-sm font-medium text-white">
              A new version is ready
            </p>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={onDismiss}
                className="press-scale rounded-lg px-2.5 py-1.5 text-sm font-medium text-white/80 active:text-white"
              >
                Later
              </button>
              <button
                type="button"
                onClick={() => void onRefresh()}
                className="press-scale rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-sage active:bg-cream"
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
