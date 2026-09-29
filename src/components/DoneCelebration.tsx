import { useEffect } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { spring } from '../lib/motion'
import { BrandMark } from './Icon'

interface DoneCelebrationProps {
  onComplete: () => void
  variant?: 'grocery' | 'home'
}

export function DoneCelebration({
  onComplete,
  variant = 'grocery',
}: DoneCelebrationProps) {
  const reducedMotion = useReducedMotion()
  const message = variant === 'home' ? 'All caught up.' : 'Done shopping.'

  useEffect(() => {
    const timer = setTimeout(onComplete, reducedMotion ? 800 : 1200)
    return () => clearTimeout(timer)
  }, [onComplete, reducedMotion])

  return (
    <motion.div
      className="viewport-overlay safe-top safe-bottom z-50 flex items-center justify-center bg-[var(--color-overlay)] px-gutter"
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reducedMotion ? undefined : { opacity: 0 }}
      transition={{ duration: 0.2 }}
      role="status"
      aria-live="polite"
    >
      <motion.div
        className="flex flex-col items-center rounded-[var(--radius-lg)] bg-cream px-8 py-10 shadow-xl dark:bg-surface-raised"
        initial={reducedMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
      >
        <motion.div
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...spring, delay: 0.05 }}
        >
          <BrandMark className="h-16 w-16" />
        </motion.div>
        <p className="mt-4 text-title font-semibold text-ink dark:text-ink-dark">
          {message}
        </p>
      </motion.div>
    </motion.div>
  )
}
