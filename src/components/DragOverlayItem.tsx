import type { GroceryItem } from '../types'
import { UserBadge } from './UserBadge'
import { Icon } from './Icon'

interface DragOverlayItemProps {
  item: GroceryItem
  currentUserName: string
}

export function DragOverlayItem({ item, currentUserName }: DragOverlayItemProps) {
  return (
    <div className="surface-card flex items-center gap-2.5 px-[var(--spacing-row-x)] py-[var(--spacing-row-y)] shadow-lg">
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
        className={`item-check flex shrink-0 items-center justify-center ${
          item.checked ? 'item-check-checked' : ''
        }`}
        aria-hidden="true"
      >
        {item.checked && <Icon name="check" size="sm" />}
      </span>
      <span
        className={`min-w-0 flex-1 truncate text-row-title leading-tight ${
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
