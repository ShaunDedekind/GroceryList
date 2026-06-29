import type { GroceryItem } from '../types'
import { UserBadge } from './UserBadge'

interface DragOverlayItemProps {
  item: GroceryItem
  currentUserName: string
}

export function DragOverlayItem({ item, currentUserName }: DragOverlayItemProps) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-sage/30 bg-white px-2 py-2 shadow-lg dark:border-sage/40 dark:bg-surface-raised">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center text-warm-gray-light">
        <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor" aria-hidden="true">
          <circle cx="2.5" cy="2.5" r="1.2" />
          <circle cx="7.5" cy="2.5" r="1.2" />
          <circle cx="2.5" cy="7" r="1.2" />
          <circle cx="7.5" cy="7" r="1.2" />
          <circle cx="2.5" cy="11.5" r="1.2" />
          <circle cx="7.5" cy="11.5" r="1.2" />
        </svg>
      </span>
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${
          item.checked
            ? 'border-sage bg-sage text-white'
            : 'border-warm-gray-light/50'
        }`}
        aria-hidden="true"
      />
      <span
        className={`min-w-0 flex-1 truncate text-body ${
          item.checked
            ? 'text-warm-gray-light line-through dark:text-warm-gray'
            : 'text-ink dark:text-ink-dark'
        }`}
      >
        {item.text}
      </span>
      <UserBadge
        name={item.added_by}
        isCurrentUser={item.added_by === currentUserName}
      />
    </div>
  )
}
