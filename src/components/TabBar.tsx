import type { ListSection } from '../types'
import { Icon } from './Icon'

interface TabBarProps {
  activeTab: ListSection
  onTabChange: (tab: ListSection) => void
  groceryCount: number
  homeCount: number
  henryCount: number
}

export function TabBar({
  activeTab,
  onTabChange,
  groceryCount,
  homeCount,
  henryCount,
}: TabBarProps) {
  const tabs: {
    id: ListSection
    label: string
    icon: 'cart' | 'home' | 'henry'
    iconFilled: 'cartFilled' | 'homeFilled' | 'henryFilled'
    count: number
  }[] = [
    { id: 'grocery', label: 'Shop', icon: 'cart', iconFilled: 'cartFilled', count: groceryCount },
    { id: 'home', label: 'Home', icon: 'home', iconFilled: 'homeFilled', count: homeCount },
    { id: 'henry', label: 'Henry', icon: 'henry', iconFilled: 'henryFilled', count: henryCount },
  ]

  return (
    <nav
      className="safe-bottom sticky bottom-0 z-20 px-3 pb-1.5 pt-0.5"
      aria-label="List sections"
    >
      <div className="flex gap-0.5 rounded-full border border-line bg-surface-strong p-0.5 shadow-card backdrop-blur-xl dark:bg-surface-strong">
        {tabs.map((tab) => {
          const selected = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onTabChange(tab.id)}
              className={`press-scale relative flex min-h-11 flex-1 items-center justify-center gap-1 rounded-full px-1.5 text-meta font-semibold transition-colors ${
                selected
                  ? 'bg-sage text-white'
                  : 'text-ink active:bg-cream-dark dark:text-ink-dark dark:active:bg-surface-raised'
              }`}
            >
              <span className="relative flex items-center">
                <Icon name={selected ? tab.iconFilled : tab.icon} size="sm" />
                {tab.count > 0 && (
                  <span
                    className={`absolute -right-2.5 -top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full px-0.5 text-[10px] font-bold leading-none ${
                      selected ? 'bg-sunshine text-ink' : 'bg-blush text-ink'
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
