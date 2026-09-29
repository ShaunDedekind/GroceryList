import { useState } from 'react'
import type { GroceryItem } from '../types'
import { hapticLight } from '../lib/haptics'
import { CategoryPicker } from './CategoryPicker'
import { BottomSheet } from './BottomSheet'
import type { DisplayCategory } from './listTabTypes'

function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function fromDatetimeLocalValue(value: string): string | null {
  if (!value.trim()) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

export interface ItemEditSavePayload {
  text: string
  category: string
  due_at?: string | null
  note?: string | null
}

interface ItemEditSheetProps {
  item: GroceryItem
  listId: string
  categories: DisplayCategory[]
  onSave: (id: string, payload: ItemEditSavePayload) => Promise<void>
  onClose: () => void
  getCategoryLabel?: (id: string) => string
  getCategoryEmoji?: (id: string) => string
  onSaveOverride?: (listId: string, text: string, category: string) => void
  showScheduleFields?: boolean
  categoryLabel?: string
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
  showScheduleFields = false,
  categoryLabel = 'Category',
}: ItemEditSheetProps) {
  const [text, setText] = useState(item.text)
  const [category, setCategory] = useState(item.category)
  const [dueLocal, setDueLocal] = useState(() => toDatetimeLocalValue(item.due_at))
  const [note, setNote] = useState(item.note ?? '')
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
      await onSave(item.id, {
        text: trimmed,
        category,
        ...(showScheduleFields
          ? {
              due_at: fromDatetimeLocalValue(dueLocal),
              note: note.trim() || null,
            }
          : {}),
      })
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
          {showScheduleFields ? 'Task' : 'Item name'}
        </span>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoFocus
          className="mt-1.5 w-full rounded-[var(--radius-md)] border border-separator bg-grouped px-3 py-2.5 text-input outline-none focus:border-sage dark:border-border-dark dark:text-ink-dark"
        />
      </label>

      {showScheduleFields && (
        <>
          <label className="mt-4 block">
            <span className="text-footnote font-medium text-warm-gray dark:text-warm-gray-light">
              Due
            </span>
            <input
              type="datetime-local"
              value={dueLocal}
              onChange={(e) => setDueLocal(e.target.value)}
              className="mt-1.5 w-full rounded-[var(--radius-md)] border border-separator bg-grouped px-3 py-2.5 text-input outline-none focus:border-sage dark:border-border-dark dark:text-ink-dark"
            />
          </label>

          <label className="mt-4 block">
            <span className="text-footnote font-medium text-warm-gray dark:text-warm-gray-light">
              Note
            </span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="mt-1.5 w-full rounded-[var(--radius-md)] border border-separator bg-grouped px-3 py-2.5 text-input outline-none focus:border-sage dark:border-border-dark dark:text-ink-dark"
            />
          </label>
        </>
      )}

      <p className="mt-4 text-footnote font-medium text-warm-gray dark:text-warm-gray-light">
        {categoryLabel}
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
        className="press-scale btn-primary mt-4 w-full text-footnote disabled:opacity-40"
      >
        Save
      </button>

      <button
        type="button"
        onClick={onClose}
        className="mt-2 min-h-11 w-full rounded-[var(--radius-lg)] text-footnote font-medium text-warm-gray active:bg-cream-dark dark:text-warm-gray-light dark:active:bg-surface"
      >
        Cancel
      </button>
    </BottomSheet>
  )
}
