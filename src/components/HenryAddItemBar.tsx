import { useState, useRef, useEffect, useCallback } from 'react'
import type { HenryCategoryId } from '../types'
import { DEFAULT_HENRY_CATEGORY } from '../constants/henryCategories'
import type { ResolvedHenryCategory } from '../lib/henryCategoryConfig'
import { hapticLight } from '../lib/haptics'
import { CategoryPicker } from './CategoryPicker'
import { Icon } from './Icon'

function fromDatetimeLocalValue(value: string): string | null {
  if (!value.trim()) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

interface HenryAddItemBarProps {
  categories: ResolvedHenryCategory[]
  onAdd: (
    text: string,
    category: HenryCategoryId,
    extras?: { due_at?: string | null; note?: string | null },
  ) => Promise<void>
}

export function HenryAddItemBar({ categories, onAdd }: HenryAddItemBarProps) {
  const [text, setText] = useState('')
  const [category, setCategory] = useState<HenryCategoryId>(DEFAULT_HENRY_CATEGORY)
  const [dueLocal, setDueLocal] = useState('')
  const [showCategories, setShowCategories] = useState(false)
  const [showDue, setShowDue] = useState(false)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [justAdded, setJustAdded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const barRef = useRef<HTMLDivElement>(null)

  const defaultCategory =
    categories.find((entry) => entry.id === DEFAULT_HENRY_CATEGORY)?.id ??
    categories[0]?.id ??
    DEFAULT_HENRY_CATEGORY

  const selected =
    categories.find((entry) => entry.id === category) ??
    categories[0] ?? {
      id: DEFAULT_HENRY_CATEGORY,
      label: 'Other',
      emoji: '✨',
      visible: true,
    }

  useEffect(() => {
    if (!showCategories) return
    const handleClick = (event: MouseEvent) => {
      if (barRef.current?.contains(event.target as Node)) return
      setShowCategories(false)
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [showCategories])

  const handleSubmit = useCallback(async () => {
    if (!text.trim() || adding) return
    setAdding(true)
    setError(null)
    setShowCategories(false)
    try {
      await onAdd(text.trim(), category, {
        due_at: fromDatetimeLocalValue(dueLocal),
      })
      setText('')
      setDueLocal('')
      setShowDue(false)
      setCategory(defaultCategory)
      hapticLight()
      setJustAdded(true)
      setTimeout(() => setJustAdded(false), 450)
      inputRef.current?.focus()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add task')
    } finally {
      setAdding(false)
    }
  }, [text, adding, onAdd, category, dueLocal, defaultCategory])

  const handleCategoryPick = (catId: string) => {
    setCategory(catId as HenryCategoryId)
    setShowCategories(false)
    inputRef.current?.focus()
  }

  const duePreview = dueLocal
    ? new Date(dueLocal).toLocaleString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : null

  return (
    <div
      ref={barRef}
      className="relative z-30 border-t border-line bg-surface-strong px-gutter py-1.5 backdrop-blur-xl dark:bg-surface-strong"
    >
      {showCategories && (
        <CategoryPicker
          categories={categories}
          selected={category}
          onSelect={handleCategoryPick}
          layout="strip"
          className="mb-1.5"
        />
      )}

      {showDue && (
        <div className="mb-1.5 flex items-center gap-2">
          <input
            type="datetime-local"
            value={dueLocal}
            onChange={(e) => setDueLocal(e.target.value)}
            className="h-9 min-w-0 flex-1 rounded-full border border-line bg-cream px-3 text-meta outline-none focus:border-sage/40 dark:bg-surface-raised dark:text-ink-dark"
          />
          {dueLocal && (
            <button
              type="button"
              onClick={() => setDueLocal('')}
              className="text-meta text-warm-gray-light"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {error && (
        <p className="mb-2 rounded-[var(--radius-md)] bg-error-banner px-3 py-2 text-footnote">
          {error}
        </p>
      )}

      <div className="flex items-center gap-1.5">
        <div className="relative min-w-0 flex-1">
          <div
            className={`flex h-11 items-center gap-1.5 rounded-full border bg-cream pl-1.5 pr-3 transition-[border-color,box-shadow] dark:bg-surface-raised ${
              justAdded
                ? 'border-sage shadow-[0_0_0_3px_rgba(0,98,65,0.15)]'
                : 'border-line focus-within:border-sage/40 focus-within:ring-2 focus-within:ring-sage/20'
            }`}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setShowCategories(!showCategories)
              }}
              className="press-scale flex h-8 shrink-0 items-center gap-0.5 rounded-full px-2 text-meta font-medium text-warm-gray dark:text-warm-gray-light"
              aria-label={`Type ${selected.label}`}
              aria-expanded={showCategories}
            >
              <span>{selected.emoji}</span>
              <Icon name="chevronDown" size="sm" />
            </button>

            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleSubmit()
                }
              }}
              placeholder="Something for Henry…"
              enterKeyHint="done"
              disabled={adding}
              className="min-w-0 flex-1 bg-transparent text-input outline-none dark:text-ink-dark"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowDue((open) => !open)}
          aria-label="Set due date"
          aria-expanded={showDue}
          className={`press-scale flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
            dueLocal || showDue
              ? 'bg-sage/15 text-sage'
              : 'surface-soft text-warm-gray dark:text-warm-gray-light'
          }`}
        >
          <Icon name="calendar" size="sm" />
        </button>
      </div>

      {duePreview && !showDue && (
        <p className="mt-1 px-1 text-meta text-warm-gray-light">
          Due {duePreview}
          {' · '}
          <button
            type="button"
            className="text-sage"
            onClick={() => setShowDue(true)}
          >
            Edit
          </button>
        </p>
      )}
    </div>
  )
}
