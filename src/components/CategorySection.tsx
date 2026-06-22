import { useState } from 'react'
import type { CategoryId, GroceryItem } from '../types'
import { getCategoryEmoji, getCategoryLabel } from '../constants/categories'
import { ItemRow } from './ItemRow'

interface CategorySectionProps {
  categoryId: CategoryId
  items: GroceryItem[]
  onToggle: (id: string, checked: boolean) => void
  onDelete: (id: string) => void
  defaultOpen?: boolean
}

export function CategorySection({
  categoryId,
  items,
  onToggle,
  onDelete,
  defaultOpen = true,
}: CategorySectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  const unchecked = items.filter((i) => !i.checked).length

  if (items.length === 0) return null

  return (
    <section className="mb-1">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 rounded-xl px-2 py-2.5 active:bg-cream-dark/60 dark:active:bg-[#2a2825]"
      >
        <span className="text-lg">{getCategoryEmoji(categoryId)}</span>
        <span className="flex-1 text-left text-sm font-semibold uppercase tracking-wide text-warm-gray dark:text-warm-gray-light">
          {getCategoryLabel(categoryId)}
        </span>
        <span className="rounded-full bg-cream-dark px-2 py-0.5 text-xs font-medium text-warm-gray dark:bg-[#2a2825] dark:text-warm-gray-light">
          {unchecked > 0 ? unchecked : items.length}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`text-warm-gray-light transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>

      {open && (
        <div className="px-2 pb-1">
          {items.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              onToggle={onToggle}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </section>
  )
}
