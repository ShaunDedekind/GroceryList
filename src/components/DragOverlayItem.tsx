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
    <div className="flex min-h-row items-center rounded-[var(--radius-md)] bg-cream shadow-lg dark:bg-surface-raised">
      <span className="hit-touch shrink-0 text-warm-gray-light">
        <Icon name="reorder" size="sm" />
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
