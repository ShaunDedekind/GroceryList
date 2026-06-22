import type { RecentItem } from '../lib/recentItems'
import { getCategoryEmoji } from '../constants/categories'

interface RecentChipsProps {
  items: RecentItem[]
  onSelect: (item: RecentItem) => void
}

export function RecentChips({ items, onSelect }: RecentChipsProps) {
  if (items.length === 0) return null

  return (
    <div className="mb-3 -mx-1 overflow-x-auto px-1">
      <div className="flex gap-2 pb-1">
        {items.map((item) => (
          <button
            key={`${item.text}-${item.category}`}
            type="button"
            onClick={() => onSelect(item)}
            className="press-scale flex shrink-0 items-center gap-1.5 rounded-full border border-cream-dark bg-cream/80 px-3 py-1.5 text-sm text-[#1e293b] active:bg-cream-dark dark:border-[#2d3f54] dark:bg-[#1e2a3a] dark:text-[#e2e8f0]"
          >
            <span className="text-base">{getCategoryEmoji(item.category)}</span>
            <span className="max-w-[8rem] truncate">{item.text}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
