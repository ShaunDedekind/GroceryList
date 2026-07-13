import type { ListSection } from '../types'

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
  const tabs: { id: ListSection; label: string; emoji: string; count: number }[] =
    [
      { id: 'grocery', label: 'Shop', emoji: '🛒', count: groceryCount },
      { id: 'home', label: 'Home', emoji: '🏠', count: homeCount },
    ]

  return (
    <nav
      className="safe-bottom sticky bottom-0 z-20 border-t border-cream-dark/80 bg-white/95 backdrop-blur-lg dark:border-border-dark/80 dark:bg-surface/95"
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
              className={`press-scale relative flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 py-2 text-meta font-medium transition-colors ${
                selected
                  ? 'text-sage dark:text-sage-light'
                  : 'text-warm-gray active:text-ink dark:text-warm-gray-light dark:active:text-ink-dark'
              }`}
            >
              <span className="text-lg leading-none" aria-hidden="true">
                {tab.emoji}
              </span>
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span
                  className={`absolute right-[calc(50%-2rem)] top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none ${
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
