import type { GroceryItem } from '../types'

interface ItemRowProps {
  item: GroceryItem
  onToggle: (id: string, checked: boolean) => void
  onDelete: (id: string) => void
}

export function ItemRow({ item, onToggle, onDelete }: ItemRowProps) {
  return (
    <div className="group flex items-center gap-3 py-2.5">
      <button
        type="button"
        onClick={() => onToggle(item.id, !item.checked)}
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          item.checked
            ? 'border-sage bg-sage text-white'
            : 'border-warm-gray-light/50 active:border-sage'
        }`}
        aria-label={item.checked ? 'Uncheck item' : 'Check item'}
      >
        {item.checked && (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M2.5 7l3 3 6-6" />
          </svg>
        )}
      </button>

      <div className="min-w-0 flex-1">
        <p
          className={`text-base leading-snug transition-all ${
            item.checked
              ? 'text-warm-gray-light line-through dark:text-warm-gray'
              : 'text-[#2c2825] dark:text-[#f0ebe3]'
          }`}
        >
          {item.text}
        </p>
        {item.added_by && (
          <p className="mt-0.5 text-xs text-warm-gray-light">{item.added_by}</p>
        )}
      </div>

      <button
        type="button"
        onClick={() => onDelete(item.id)}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-warm-gray-light opacity-60 transition-opacity group-hover:opacity-100 active:bg-red-50 active:text-red-500 active:opacity-100 dark:active:bg-red-950/30"
        aria-label="Delete item"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4.5 4.5l9 9M13.5 4.5l-9 9" />
        </svg>
      </button>
    </div>
  )
}
