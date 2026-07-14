import { useEffect } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { springSnappy } from '../lib/motion'
import { Icon } from './Icon'

const MAX_TEXT_LEN = 28

function truncateText(text: string): string {
  if (text.length <= MAX_TEXT_LEN) return text
  return `${text.slice(0, MAX_TEXT_LEN - 1)}…`
}

interface PartnerToastProps {
  name: string
  text: string
  onDismiss: () => void
}

export function PartnerToast({ name, text, onDismiss }: PartnerToastProps) {
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    const timer = setTimeout(onDismiss, 2500)
    return () => clearTimeout(timer)
  }, [onDismiss, name, text])

  return (
    <motion.button
      type="button"
      onClick={onDismiss}
      initial={reducedMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reducedMotion ? undefined : { opacity: 0, y: 8 }}
      transition={springSnappy}
      className="fixed bottom-[calc(4.5rem+max(0.75rem,env(safe-area-inset-bottom))+var(--vv-offset-bottom,0px))] left-4 right-4 z-40 mx-auto flex max-w-lg items-center gap-3 overflow-hidden rounded-[var(--radius-lg)] border border-separator bg-cream px-4 py-3 text-left shadow-lg dark:bg-surface-raised"
      role="status"
      aria-live="polite"
    >
      <div className="h-8 w-1 shrink-0 rounded-full bg-sage" aria-hidden="true" />
      <Icon name="cart" size="sm" className="text-sage dark:text-sage-light" />
      <p className="min-w-0 flex-1 text-body text-ink dark:text-ink-dark">
        <span className="font-semibold">{name}</span>
        {' added '}
        <span className="text-warm-gray dark:text-warm-gray-light">
          {truncateText(text)}
        </span>
      </p>
    </motion.button>
  )
}
