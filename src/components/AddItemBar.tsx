import { useState, useRef, useEffect } from 'react'
import type { CategoryId } from '../types'
import { CATEGORIES, DEFAULT_CATEGORY } from '../constants/categories'

interface AddItemBarProps {
  onAdd: (text: string, category: CategoryId) => Promise<void>
}

export function AddItemBar({ onAdd }: AddItemBarProps) {
  const [text, setText] = useState('')
  const [category, setCategory] = useState<CategoryId>(DEFAULT_CATEGORY)
  const [showCategories, setShowCategories] = useState(false)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = CATEGORIES.find((c) => c.id === category)!

  const handleSubmit = async () => {
    if (!text.trim() || adding) return
    setAdding(true)
    setError(null)
    try {
      await onAdd(text, category)
      setText('')
      inputRef.current?.focus()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add item')
    } finally {
      setAdding(false)
    }
  }

  useEffect(() => {
    if (showCategories) return
    const handleClick = () => setShowCategories(false)
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [showCategories])

  return (
    <div className="safe-bottom border-t border-cream-dark bg-white/90 px-4 py-3 backdrop-blur-lg dark:border-[#3a3835] dark:bg-[#1a1917]/90">
      {showCategories && (
        <div
          className="mb-3 grid grid-cols-3 gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setCategory(cat.id)
                setShowCategories(false)
              }}
              className={`flex items-center gap-1.5 rounded-xl px-2.5 py-2.5 text-sm font-medium transition-colors ${
                category === cat.id
                  ? 'bg-sage/15 text-sage-dark dark:text-sage-light'
                  : 'bg-cream-dark/60 text-warm-gray active:bg-cream-dark dark:bg-[#2a2825] dark:text-warm-gray-light'
              }`}
            >
              <span>{cat.emoji}</span>
              <span className="truncate">{cat.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setShowCategories(!showCategories)
          }}
          className="flex h-11 shrink-0 items-center gap-1 rounded-xl bg-cream-dark px-3 text-sm font-medium text-warm-gray active:bg-cream-dark/80 dark:bg-[#2a2825] dark:text-warm-gray-light"
        >
          <span>{selected.emoji}</span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 4.5l3 3 3-3" />
          </svg>
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
          placeholder="Add item…"
          enterKeyHint="done"
          className="min-w-0 flex-1 rounded-xl border border-cream-dark bg-cream/50 px-4 py-3 text-base outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 dark:border-[#3a3835] dark:bg-[#2a2825] dark:text-[#f0ebe3]"
        />

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!text.trim() || adding}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sage text-white disabled:opacity-40 active:bg-sage-dark"
          aria-label="Add item"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M10 4v12M4 10h12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
