import { useEffect, useState } from 'react'
import type { CategoryId } from '../types'
import {
  type ResolvedCategory,
} from '../lib/categoryConfig'

interface AisleSectionsSettingsProps {
  categories: ResolvedCategory[]
  onSave: (categories: ResolvedCategory[]) => Promise<void>
}

export function AisleSectionsSettings({
  categories: initialCategories,
  onSave,
}: AisleSectionsSettingsProps) {
  const [categories, setCategories] = useState(initialCategories)
  const [editingId, setEditingId] = useState<CategoryId | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setCategories(initialCategories)
  }, [initialCategories])

  const moveCategory = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= categories.length) return
    setCategories((current) => {
      const next = [...current]
      const [item] = next.splice(index, 1)
      next.splice(nextIndex, 0, item)
      return next
    })
  }

  const toggleVisibility = (id: CategoryId) => {
    setCategories((current) =>
      current.map((category) =>
        category.id === id
          ? { ...category, visible: !category.visible }
          : category,
      ),
    )
  }

  const startRename = (category: ResolvedCategory) => {
    setEditingId(category.id)
    setEditLabel(category.label)
  }

  const commitRename = () => {
    if (!editingId) return
    const trimmed = editLabel.trim()
    if (!trimmed) {
      setEditingId(null)
      return
    }

    setCategories((current) =>
      current.map((category) =>
        category.id === editingId ? { ...category, label: trimmed } : category,
      ),
    )
    setEditingId(null)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      await onSave(categories)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save aisle sections')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-meta font-medium text-warm-gray dark:text-warm-gray-light">
          Aisle sections
        </p>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="rounded-lg px-2.5 py-1 text-meta font-semibold text-sage active:bg-sage/10 disabled:opacity-40 dark:active:bg-sage/20"
        >
          {saving ? 'Saving…' : 'Save sections'}
        </button>
      </div>

      <ul className="mt-2 max-h-56 space-y-1 overflow-y-auto">
        {categories.map((category, index) => (
          <li
            key={category.id}
            className="flex items-center gap-2 rounded-xl bg-cream/60 px-2 py-2 dark:bg-surface"
          >
            <div className="flex shrink-0 flex-col">
              <button
                type="button"
                onClick={() => moveCategory(index, -1)}
                disabled={index === 0}
                aria-label={`Move ${category.label} up`}
                className="rounded px-1 text-warm-gray-light disabled:opacity-30 active:text-sage"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => moveCategory(index, 1)}
                disabled={index === categories.length - 1}
                aria-label={`Move ${category.label} down`}
                className="rounded px-1 text-warm-gray-light disabled:opacity-30 active:text-sage"
              >
                ▼
              </button>
            </div>

            <span className="shrink-0 text-base">{category.emoji}</span>

            {editingId === category.id ? (
              <input
                type="text"
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitRename()
                  if (e.key === 'Escape') setEditingId(null)
                }}
                autoFocus
                className="min-w-0 flex-1 rounded-lg border border-cream-dark bg-white px-2 py-1 text-input outline-none focus:border-sage dark:border-border-dark dark:bg-surface-raised dark:text-ink-dark"
              />
            ) : (
              <button
                type="button"
                onClick={() => startRename(category)}
                className="min-w-0 flex-1 truncate text-left text-body text-ink active:opacity-70 dark:text-ink-dark"
              >
                {category.label}
              </button>
            )}

            <button
              type="button"
              onClick={() => toggleVisibility(category.id)}
              aria-label={category.visible ? `Hide ${category.label}` : `Show ${category.label}`}
              className={`shrink-0 rounded-lg px-2 py-1 text-meta font-medium ${
                category.visible
                  ? 'text-sage active:bg-sage/10 dark:active:bg-sage/20'
                  : 'text-warm-gray-light active:bg-cream-dark dark:active:bg-surface-raised'
              }`}
            >
              {category.visible ? 'Shown' : 'Hidden'}
            </button>
          </li>
        ))}
      </ul>

      {error && (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-meta text-red-600 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </p>
      )}

      <p className="mt-2 text-meta text-warm-gray-light">
        Tap a name to rename. Hidden sections stay saved but won&apos;t appear in your list.
      </p>
    </div>
  )
}
