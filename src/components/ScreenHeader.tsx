import type { RefObject } from 'react'
import { motion, useReducedMotion, LayoutGroup } from 'motion/react'
import type { ListSection } from '../types'
import { Icon } from './Icon'
import { spring, springSnappy } from '../lib/motion'

const TABS: { id: Extract<ListSection, 'home' | 'henry'>; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'henry', label: 'Henry' },
]

interface TitleBlockProps {
  activeTab: Extract<ListSection, 'home' | 'henry'>
  onTabChange: (tab: Extract<ListSection, 'home' | 'henry'>) => void
  subtitle: string
  onOpenSettings: () => void
  titleRef?: RefObject<HTMLDivElement | null>
}

export function LargeTitle({
  activeTab,
  onTabChange,
  subtitle,
  onOpenSettings,
  titleRef,
}: TitleBlockProps) {
  const reducedMotion = useReducedMotion()

  return (
    <div ref={titleRef} className="safe-top px-gutter pb-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 py-1">
          <LayoutGroup>
            <div
              className="flex flex-wrap items-baseline gap-x-3 gap-y-1"
              role="tablist"
              aria-label="Sections"
            >
              {TABS.map((tab) => {
                const selected = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => onTabChange(tab.id)}
                    className="relative min-h-11 py-1 text-left"
                  >
                    <motion.span
                      className={`text-large-title ${
                        selected
                          ? 'text-ink dark:text-ink-dark'
                          : 'text-warm-gray-light/70 dark:text-warm-gray/50'
                      }`}
                      animate={{
                        opacity: selected ? 1 : 0.45,
                        scale: selected ? 1 : 0.96,
                      }}
                      transition={reducedMotion ? { duration: 0 } : springSnappy}
                    >
                      {tab.label}
                    </motion.span>
                    {selected && (
                      <motion.span
                        layoutId="tab-underline"
                        className="absolute inset-x-0 -bottom-0.5 h-1 rounded-full bg-attention"
                        transition={reducedMotion ? { duration: 0 } : spring}
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </LayoutGroup>
          <motion.p
            key={subtitle}
            initial={reducedMotion ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reducedMotion ? { duration: 0 } : springSnappy}
            className="mt-1.5 truncate text-footnote text-warm-gray dark:text-warm-gray-light"
          >
            {subtitle || '\u00a0'}
          </motion.p>
        </div>
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="Settings"
          className="hit-touch mt-1 shrink-0 text-ink dark:text-ink-dark"
        >
          <Icon name="settings" />
        </button>
      </div>
    </div>
  )
}

export function CompactTitleBar({
  activeTab,
  onTabChange,
  visible,
  onOpenSettings,
}: {
  activeTab: Extract<ListSection, 'home' | 'henry'>
  onTabChange: (tab: Extract<ListSection, 'home' | 'henry'>) => void
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
        <div className="relative flex h-11 items-center justify-center gap-4 px-gutter">
          <div className="flex items-baseline gap-3" role="tablist" aria-label="Sections">
            {TABS.map((tab) => {
              const selected = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  tabIndex={visible ? 0 : -1}
                  onClick={() => onTabChange(tab.id)}
                  className={`text-headline ${
                    selected
                      ? 'font-extrabold text-ink dark:text-ink-dark'
                      : 'font-semibold text-warm-gray-light'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Settings"
            tabIndex={visible ? 0 : -1}
            className="hit-touch absolute right-1 text-ink dark:text-ink-dark"
          >
            <Icon name="settings" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
