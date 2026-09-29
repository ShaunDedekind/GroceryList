import type { ListSection } from '../types'
import { Icon } from './Icon'

interface TabBarProps {
  activeTab: ListSection
  onTabChange: (tab: ListSection) => void
  groceryCount: number
  homeCount: number
}

export function TabBar({
  activeTab,
  onTabChange,
  groceryCount,
  homeCount,
}: TabBarProps) {
  const tabs: {
    id: ListSection
    label: string
    icon: 'cart' | 'home'
    iconFilled: 'cartFilled' | 'homeFilled'
    count: number
  }[] = [
    { id: 'grocery', label: 'Shop', icon: 'cart', iconFilled: 'cartFilled', count: groceryCount },
    { id: 'home', label: 'Home', icon: 'home', iconFilled: 'homeFilled', count: homeCount },
  ]

  return (
    <nav
      className="safe-bottom sticky bottom-0 z-20 px-3 pb-2 pt-1"
      aria-label="List sections"
    >
      <div className="flex gap-1 rounded-[var(--radius-lg)] border border-line bg-surface-strong p-1 shadow-card backdrop-blur-xl dark:bg-surface-strong">
        {tabs.map((tab) => {
          const selected = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onTabChange(tab.id)}
              className={`press-scale relative flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-[var(--radius-pill)] py-1.5 text-meta font-semibold transition-colors ${
                selected
                  ? 'bg-sage text-white shadow-card'
                  : 'text-ink active:bg-cream-dark dark:text-ink-dark dark:active:bg-surface-raised'
              }`}
            >
              <span className="relative">
                <Icon name={selected ? tab.iconFilled : tab.icon} size="md" />
                {tab.count > 0 && (
                  <span
                    className={`absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-meta font-bold leading-none ${
                      selected
                        ? 'bg-sunshine text-ink'
                        : 'bg-blush text-ink'
                    }`}
                  >
                    {tab.count > 99 ? '99+' : tab.count}
                  </span>
                )}
              </span>
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
