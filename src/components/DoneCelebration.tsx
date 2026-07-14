import { useEffect } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { hapticMedium } from '../lib/haptics'
import { spring } from '../lib/motion'

interface DoneCelebrationProps {
  onComplete: () => void
}

export function DoneCelebration({ onComplete }: DoneCelebrationProps) {
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    hapticMedium()
    const timer = setTimeout(onComplete, reducedMotion ? 800 : 1200)
    return () => clearTimeout(timer)
  }, [onComplete, reducedMotion])

  return (
    <motion.div
      className="viewport-overlay safe-top safe-bottom z-50 flex items-center justify-center bg-black/30 px-6"
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reducedMotion ? undefined : { opacity: 0 }}
      transition={{ duration: 0.2 }}
      role="status"
      aria-live="polite"
    >
      <motion.div
        className="flex flex-col items-center rounded-3xl bg-white px-8 py-10 shadow-xl dark:bg-surface-raised"
        initial={reducedMotion ? false : { scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={spring}
      >
        <motion.div
          className="flex h-16 w-16 items-center justify-center rounded-full bg-celebrate/15 text-celebrate"
          initial={reducedMotion ? false : { scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ ...spring, delay: 0.05 }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12l5 5L20 7" />
          </svg>
        </motion.div>
        <p className="mt-4 text-title font-semibold text-ink dark:text-ink-dark">
          Shop done. Nice one.
        </p>
      </motion.div>
    </motion.div>
  )
}
