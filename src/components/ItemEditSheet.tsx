import { useState } from 'react'
import type { CategoryId, GroceryItem } from '../types'
import { CATEGORIES } from '../constants/categories'
import { saveOverride } from '../lib/categoryOverrides'
import { hapticLight } from '../lib/haptics'

interface ItemEditSheetProps {
  item: GroceryItem
  listId: string
  onSave: (id: string, text: string, category: CategoryId) => Promise<void>
  onClose: () => void
}

export function ItemEditSheet({ item, listId, onSave, onClose }: ItemEditSheetProps) {
  const [text, setText] = useState(item.text)
  const [category, setCategory] = useState<CategoryId>(item.category as CategoryId)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    const trimmed = text.trim()
    if (!trimmed || saving) return

    setSaving(true)
    setError(null)
    try {
      await onSave(item.id, trimmed, category)
      saveOverride(listId, trimmed, category)
      hapticLight()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save item')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="safe-bottom w-full max-w-lg rounded-t-3xl bg-white px-6 pb-8 pt-6 dark:bg-[#1e2a3a]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-cream-dark dark:bg-[#2d3f54]" />
        <h3 className="text-lg font-semibold text-[#1e293b] dark:text-[#e2e8f0]">
          Edit item
        </h3>

        <label className="mt-5 block">
          <span className="text-sm font-medium text-warm-gray dark:text-warm-gray-light">
            Item name
          </span>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoFocus
            className="mt-2 w-full rounded-xl border border-cream-dark bg-cream/50 px-4 py-3 text-base outline-none focus:border-sage dark:border-[#2d3f54] dark:bg-[#141c27] dark:text-[#e2e8f0]"
          />
        </label>

        <p className="mt-5 text-sm font-medium text-warm-gray dark:text-warm-gray-light">
          Category
        </p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
              className={`press-scale flex items-center gap-1.5 rounded-xl px-2.5 py-2.5 text-sm font-medium transition-colors ${
                category === cat.id
                  ? 'bg-sage/15 text-sage-dark dark:text-sage-light'
                  : 'bg-cream-dark/60 text-warm-gray active:bg-cream-dark dark:bg-[#141c27] dark:text-warm-gray-light'
              }`}
            >
              <span>{cat.emoji}</span>
              <span className="truncate">{cat.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={!text.trim() || saving}
          className="press-scale mt-5 w-full rounded-2xl bg-sage py-3.5 font-semibold text-white disabled:opacity-40 active:bg-sage-dark"
        >
          Save
        </button>

        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full rounded-2xl py-3.5 font-medium text-warm-gray active:bg-cream-dark dark:text-warm-gray-light dark:active:bg-[#141c27]"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
