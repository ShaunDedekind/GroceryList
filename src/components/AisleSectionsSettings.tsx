import { useState } from 'react'
import type { CategoryId } from '../types'
import { createCustomCategoryId } from '../constants/categories'
import { type ResolvedCategory } from '../lib/categoryConfig'
import { Icon } from './Icon'

interface AisleSectionsSettingsProps {
  categories: ResolvedCategory[]
  onSave: (categories: ResolvedCategory[]) => Promise<void>
  onDeleteCustom?: (category: ResolvedCategory) => Promise<void>
}

const EMOJI_CHOICES = [
  '🛒',
  '🍫',
  '🌶️',
  '🧀',
  '🐟',
  '🌾',
  '☕',
  '🧃',
  '🧴',
  '🧼',
  '🎁',
  '⭐',
  '🧺',
  '🍼',
  '🪴',
]

export function AisleSectionsSettings({
  categories: initialCategories,
  onSave,
  onDeleteCustom,
}: AisleSectionsSettingsProps) {
  const [categories, setCategories] = useState(initialCategories)
  const [syncedCategories, setSyncedCategories] = useState(initialCategories)
  const [editingId, setEditingId] = useState<CategoryId | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editEmoji, setEditEmoji] = useState('')
  const [editKeywords, setEditKeywords] = useState('')
  const [creating, setCreating] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newEmoji, setNewEmoji] = useState('🛒')
  const [newKeywords, setNewKeywords] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<CategoryId | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (initialCategories !== syncedCategories) {
    setSyncedCategories(initialCategories)
    setCategories(initialCategories)
  }

  const parseKeywords = (value: string): string[] =>
    value
      .split(',')
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean)

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
    setCreating(false)
    setEditingId(category.id)
    setEditLabel(category.label)
    setEditEmoji(category.emoji)
    setEditKeywords(category.keywords.join(', '))
  }

  const commitRename = () => {
    if (!editingId) return
    const trimmed = editLabel.trim()
    const emoji = editEmoji.trim() || '🛒'
    if (!trimmed) {
      setEditingId(null)
      return
    }

    const keywords = parseKeywords(editKeywords)
    setCategories((current) =>
      current.map((category) =>
        category.id === editingId
          ? {
              ...category,
              label: trimmed,
              emoji,
              keywords: category.builtin ? category.keywords : keywords,
            }
          : category,
      ),
    )
    setEditingId(null)
  }

  const handleCreate = () => {
    const label = newLabel.trim()
    if (!label) return
    const id = createCustomCategoryId(label)
    const keywords = parseKeywords(newKeywords)
    const next: ResolvedCategory = {
      id,
      label,
      emoji: newEmoji.trim() || '🛒',
      visible: true,
      builtin: false,
      keywords,
    }
    setCategories((current) => {
      const otherIndex = current.findIndex((category) => category.id === 'other')
      if (otherIndex === -1) return [...current, next]
      const copy = [...current]
      copy.splice(otherIndex, 0, next)
      return copy
    })
    setCreating(false)
    setNewLabel('')
    setNewEmoji('🛒')
    setNewKeywords('')
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

  const handleDelete = async (category: ResolvedCategory) => {
    if (category.builtin || !onDeleteCustom) return
    const confirmed = window.confirm(
      `Delete “${category.label}”? Items in this aisle move to Other.`,
    )
    if (!confirmed) return

    setDeletingId(category.id)
    setError(null)
    try {
      await onDeleteCustom(category)
      setCategories((current) =>
        current.filter((entry) => entry.id !== category.id),
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete aisle')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      <div className="flex min-h-11 items-center justify-between gap-2 border-b border-separator px-4">
        <p className="text-body text-ink dark:text-ink-dark">Aisle sections</p>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="hit-touch text-body font-semibold text-sage active:opacity-70 disabled:opacity-40"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      <ul className="max-h-64 overflow-y-auto">
        {categories.map((category, index) => (
          <li
            key={category.id}
            className={`px-3 py-2 ${
              index < categories.length - 1 ? 'border-b border-separator' : ''
            }`}
          >
            <div className="flex min-h-touch items-center gap-2">
              <div className="flex shrink-0">
                <button
                  type="button"
                  onClick={() => moveCategory(index, -1)}
                  disabled={index === 0}
                  aria-label={`Move ${category.label} up`}
                  className="hit-touch text-warm-gray disabled:opacity-30 active:text-sage"
                >
                  <Icon name="chevronDown" size="sm" className="rotate-180" />
                </button>
                <button
                  type="button"
                  onClick={() => moveCategory(index, 1)}
                  disabled={index === categories.length - 1}
                  aria-label={`Move ${category.label} down`}
                  className="hit-touch text-warm-gray disabled:opacity-30 active:text-sage"
                >
                  <Icon name="chevronDown" size="sm" />
                </button>
              </div>

              {editingId === category.id ? (
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editEmoji}
                      onChange={(e) => setEditEmoji(e.target.value)}
                      maxLength={4}
                      aria-label="Emoji"
                      className="h-11 w-11 shrink-0 rounded-[var(--radius-sm)] border border-separator bg-cream text-center text-input outline-none focus:border-sage dark:bg-surface-raised"
                    />
                    <input
                      type="text"
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitRename()
                        if (e.key === 'Escape') {
                          e.preventDefault()
                          setEditingId(null)
                        }
                      }}
                      autoFocus
                      className="min-h-11 min-w-0 flex-1 rounded-[var(--radius-sm)] border border-separator bg-cream px-2 text-input outline-none focus:border-sage dark:bg-surface-raised dark:text-ink-dark"
                    />
                  </div>
                  {!category.builtin && (
                    <input
                      type="text"
                      value={editKeywords}
                      onChange={(e) => setEditKeywords(e.target.value)}
                      placeholder="Keywords, comma separated"
                      className="min-h-11 w-full rounded-[var(--radius-sm)] border border-separator bg-cream px-2 text-input outline-none focus:border-sage dark:bg-surface-raised dark:text-ink-dark"
                    />
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={commitRename}
                      className="hit-touch text-meta font-semibold text-sage"
                    >
                      Done
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="hit-touch text-meta text-warm-gray"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <span className="shrink-0 text-base">{category.emoji}</span>
                  <button
                    type="button"
                    onClick={() => startRename(category)}
                    className="min-w-0 flex-1 truncate text-left text-body text-ink active:opacity-70 dark:text-ink-dark"
                  >
                    {category.label}
                  </button>
                </>
              )}

              {editingId !== category.id && (
                <>
                  <button
                    type="button"
                    onClick={() => toggleVisibility(category.id)}
                    aria-label={
                      category.visible
                        ? `Hide ${category.label}`
                        : `Show ${category.label}`
                    }
                    className={`shrink-0 rounded-[var(--radius-sm)] px-2 py-1 text-footnote font-medium ${
                      category.visible
                        ? 'text-sage active:bg-sage/10 dark:active:bg-sage/20'
                        : 'text-warm-gray-light active:bg-cream-dark dark:active:bg-surface'
                    }`}
                  >
                    {category.visible ? 'Shown' : 'Hidden'}
                  </button>
                  {!category.builtin && (
                    <button
                      type="button"
                      onClick={() => void handleDelete(category)}
                      disabled={deletingId === category.id}
                      aria-label={`Delete ${category.label}`}
                      className="hit-touch shrink-0 text-error disabled:opacity-40"
                    >
                      <Icon name="close" size="sm" />
                    </button>
                  )}
                </>
              )}
            </div>
          </li>
        ))}
      </ul>

      {creating ? (
        <div className="space-y-2 border-t border-separator px-4 py-3">
          <p className="text-meta font-semibold text-warm-gray dark:text-warm-gray-light">
            New aisle
          </p>
          <div className="flex flex-wrap gap-1.5">
            {EMOJI_CHOICES.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setNewEmoji(emoji)}
                className={`hit-touch rounded-[var(--radius-sm)] text-base ${
                  newEmoji === emoji
                    ? 'bg-sage/15 ring-2 ring-sage/30'
                    : 'active:bg-cream-dark dark:active:bg-surface'
                }`}
                aria-label={`Choose ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Aisle name"
            className="min-h-11 w-full rounded-[var(--radius-sm)] border border-separator bg-cream px-3 text-input outline-none focus:border-sage dark:bg-surface-raised dark:text-ink-dark"
          />
          <input
            type="text"
            value={newKeywords}
            onChange={(e) => setNewKeywords(e.target.value)}
            placeholder="Keywords, comma separated"
            className="min-h-11 w-full rounded-[var(--radius-sm)] border border-separator bg-cream px-3 text-input outline-none focus:border-sage dark:bg-surface-raised dark:text-ink-dark"
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCreate}
              disabled={!newLabel.trim()}
              className="hit-touch text-body font-semibold text-sage disabled:opacity-40"
            >
              Add aisle
            </button>
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="hit-touch text-body text-warm-gray"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setEditingId(null)
            setCreating(true)
          }}
          className="flex min-h-11 w-full items-center border-t border-separator px-4 text-left text-body font-semibold text-sage"
        >
          Add aisle
        </button>
      )}

      {error && (
        <p className="mt-2 rounded-[var(--radius-md)] bg-error-banner px-3 py-2 text-footnote">
          {error}
        </p>
      )}

      <p className="px-4 py-2 text-footnote text-warm-gray dark:text-warm-gray-light">
        Tap a name to rename. Custom aisles can use keywords for auto-sorting.
        Hidden sections stay saved but won&apos;t appear in your list.
      </p>
    </div>
  )
}
