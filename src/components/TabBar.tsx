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
      className="safe-bottom sticky bottom-0 z-20 border-t border-separator bg-cream dark:bg-surface"
      aria-label="List sections"
    >
      <div className="flex">
        {tabs.map((tab) => {
          const selected = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onTabChange(tab.id)}
              className={`press-scale relative flex min-h-touch flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-footnote font-medium transition-colors ${
                selected
                  ? 'text-sage dark:text-sage-light'
                  : 'text-warm-gray active:text-ink dark:text-warm-gray-light dark:active:text-ink-dark'
              }`}
            >
              <Icon name={selected ? tab.iconFilled : tab.icon} size="md" />
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span
                  className={`absolute right-[calc(50%-2rem)] top-2 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-meta font-bold leading-none ${
                    selected
                      ? 'bg-sage text-white'
                      : 'bg-cream-dark text-warm-gray dark:bg-surface-raised dark:text-warm-gray-light'
                  }`}
                >
                  {tab.count > 99 ? '99+' : tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
