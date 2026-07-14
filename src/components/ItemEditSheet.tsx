import { useState } from 'react'
import type { GroceryItem } from '../types'
import { hapticLight } from '../lib/haptics'
import { CategoryPicker } from './CategoryPicker'
import { BottomSheet } from './BottomSheet'
import type { DisplayCategory } from './listTabTypes'

interface ItemEditSheetProps {
  item: GroceryItem
  listId: string
  categories: DisplayCategory[]
  onSave: (id: string, text: string, category: string) => Promise<void>
  onClose: () => void
  getCategoryLabel?: (id: string) => string
  getCategoryEmoji?: (id: string) => string
  onSaveOverride?: (listId: string, text: string, category: string) => void
}

export function ItemEditSheet({
  item,
  listId,
  categories,
  onSave,
  onClose,
  getCategoryLabel,
  getCategoryEmoji,
  onSaveOverride,
}: ItemEditSheetProps) {
  const [text, setText] = useState(item.text)
  const [category, setCategory] = useState(item.category)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pickerCategories =
    categories.some((entry) => entry.id === category)
      ? categories
      : [
          ...categories,
          {
            id: category,
            label: getCategoryLabel?.(category) ?? category,
            emoji: getCategoryEmoji?.(category) ?? '📦',
            visible: false,
          },
        ]

  const handleSave = async () => {
    const trimmed = text.trim()
    if (!trimmed || saving) return

    setSaving(true)
    setError(null)
    try {
      await onSave(item.id, trimmed, category)
      onSaveOverride?.(listId, trimmed, category)
      hapticLight()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save item')
    } finally {
      setSaving(false)
    }
  }

  return (
    <BottomSheet onClose={onClose} maxHeightClass="max-h-vv-90">
      <h3 className="text-title font-semibold text-ink dark:text-ink-dark">
        Edit item
      </h3>

      <label className="mt-4 block">
        <span className="text-footnote font-medium text-warm-gray dark:text-warm-gray-light">
          Item name
        </span>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoFocus
          className="mt-1.5 w-full rounded-[var(--radius-md)] border border-separator bg-grouped px-3 py-2.5 text-input outline-none focus:border-sage dark:border-border-dark dark:text-ink-dark"
        />
      </label>

      <p className="mt-4 text-footnote font-medium text-warm-gray dark:text-warm-gray-light">
        Category
      </p>
      <CategoryPicker
        categories={pickerCategories}
        selected={category}
        onSelect={(id) => setCategory(id as typeof category)}
        className="mt-1.5"
      />

      {error && (
        <p className="mt-3 rounded-[var(--radius-md)] bg-error-banner px-3 py-2 text-footnote">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={!text.trim() || saving}
        className="press-scale mt-4 w-full rounded-[var(--radius-lg)] bg-sage py-2.5 text-footnote font-semibold text-white disabled:opacity-40 active:bg-sage-dark"
      >
        Save
      </button>

      <button
        type="button"
        onClick={onClose}
        className="mt-2 w-full rounded-[var(--radius-lg)] py-2.5 text-footnote font-medium text-warm-gray active:bg-cream-dark dark:text-warm-gray-light dark:active:bg-surface"
      >
        Cancel
      </button>
    </BottomSheet>
  )
}
