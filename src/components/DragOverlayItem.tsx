import type { GroceryItem } from '../types'
import { parseItemDisplay } from '../lib/itemNote'
import { UserBadge } from './UserBadge'
import { Icon } from './Icon'

interface DragOverlayItemProps {
  item: GroceryItem
  currentUserName: string
}

export function DragOverlayItem({ item, currentUserName }: DragOverlayItemProps) {
  const { title, note } = parseItemDisplay(item.text)

  return (
    <div className="flex min-h-row items-center gap-1.5 border border-line bg-cream px-1 shadow-lg dark:bg-surface-raised">
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
      <div className="min-w-0 flex-1">
        <span
          className={`block truncate text-row-title leading-tight ${
            item.checked
              ? 'text-warm-gray-light line-through dark:text-warm-gray'
              : 'text-ink dark:text-ink-dark'
          }`}
        >
          {title}
        </span>
        {note && (
          <span className="mt-0.5 block truncate text-meta text-warm-gray-light">
            {note}
          </span>
        )}
      </div>
      <UserBadge
        name={item.added_by}
        isCurrentUser={item.added_by === currentUserName}
      />
    </div>
  )
}
