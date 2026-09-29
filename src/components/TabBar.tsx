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
      className="safe-bottom sticky bottom-0 z-20 px-3 pt-1"
      aria-label="List sections"
    >
      <div className="flex rounded-full border border-line bg-surface-strong p-1 shadow-card backdrop-blur-xl">
        {tabs.map((tab) => {
          const selected = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-full px-1 active:opacity-70 ${
                selected ? 'text-sage' : 'text-warm-gray dark:text-warm-gray-light'
              }`}
            >
              <span className="relative flex h-6 w-6 items-center justify-center">
                <Icon name={selected ? tab.iconFilled : tab.icon} size="lg" />
                {tab.count > 0 && (
                  <span className="absolute -right-2.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blush px-1 text-caption font-semibold leading-none text-ink">
                    {tab.count > 99 ? '99+' : tab.count}
                  </span>
                )}
              </span>
              <span className="text-caption font-medium">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
