import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import type { CategoryId } from '../types'
import { CATEGORIES, DEFAULT_CATEGORY, getCategoryEmoji } from '../constants/categories'
import { hapticLight } from '../lib/haptics'
import { springSnappy } from '../lib/motion'
import { guessCategory } from '../lib/categoryGuess'
import { saveOverride } from '../lib/categoryOverrides'
import { parseItemText } from '../lib/parseItemText'
import { getRecentItems, type RecentItem } from '../lib/recentItems'
import { RecentChips } from './RecentChips'

interface AddItemBarProps {
  listId: string
  onAdd: (text: string, category: CategoryId) => Promise<void>
}

export function AddItemBar({ listId, onAdd }: AddItemBarProps) {
  const [text, setText] = useState('')
  const [category, setCategory] = useState<CategoryId>(DEFAULT_CATEGORY)
  const [suggestedCategory, setSuggestedCategory] = useState<CategoryId | null>(null)
  const [showCategories, setShowCategories] = useState(false)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [justAdded, setJustAdded] = useState(false)
  const [recentItems, setRecentItems] = useState<RecentItem[]>(() =>
    getRecentItems(listId),
  )
  const [categoryIsManual, setCategoryIsManual] = useState(false)
  const [showHints, setShowHints] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const reducedMotion = useReducedMotion()

  const selected = CATEGORIES.find((c) => c.id === category)!
  const isSuggested =
    suggestedCategory !== null && category === suggestedCategory && !categoryIsManual

  const recentHints = useMemo(() => {
    if (text.trim().length < 2) return []
    const prefix = text.trim().toLowerCase()
    return recentItems
      .filter((item) => item.text.toLowerCase().startsWith(prefix))
      .slice(0, 5)
  }, [text, recentItems])

  const refreshRecent = useCallback(() => {
    setRecentItems(getRecentItems(listId))
  }, [listId])

  const handleSubmit = async () => {
    if (!text.trim() || adding) return
    setAdding(true)
    setError(null)
    setShowHints(false)
    try {
      const { text: parsedText } = parseItemText(text)
      if (!parsedText) return

      await onAdd(parsedText, category)
      saveOverride(listId, parsedText, category)
      setText('')
      setCategoryIsManual(false)
      setSuggestedCategory(null)
      setCategory(DEFAULT_CATEGORY)
      refreshRecent()
      hapticLight()
      setJustAdded(true)
      setTimeout(() => setJustAdded(false), 400)
      inputRef.current?.focus()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add item')
    } finally {
      setAdding(false)
    }
  }

  const handleTextChange = (value: string) => {
    setText(value)
    setShowHints(value.trim().length >= 2)
    if (categoryIsManual) return
    const guessed = guessCategory(value, listId)
    setSuggestedCategory(guessed)
    if (guessed) setCategory(guessed)
  }

  const handleCategoryPick = (catId: CategoryId) => {
    setCategoryIsManual(true)
    setSuggestedCategory(null)
    setCategory(catId)
    setShowCategories(false)
    if (text.trim()) {
      const { text: parsedText } = parseItemText(text)
      if (parsedText) saveOverride(listId, parsedText, catId)
    }
  }

  const handleRecentSelect = (item: RecentItem) => {
    setCategoryIsManual(true)
    setSuggestedCategory(null)
    setText(item.text)
    setCategory(item.category)
    setShowHints(false)
    inputRef.current?.focus()
  }

  useEffect(() => {
    if (showCategories) return
    const handleClick = () => setShowCategories(false)
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [showCategories])

  return (
    <div className="safe-bottom border-t border-cream-dark bg-white/90 px-4 py-3 backdrop-blur-lg dark:border-[#2d3f54] dark:bg-[#141c27]/90">
      {showCategories && (
        <div
          className="mb-3 grid grid-cols-3 gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategoryPick(cat.id)}
              className={`press-scale flex items-center gap-1.5 rounded-xl px-2.5 py-2.5 text-sm font-medium transition-colors ${
                category === cat.id
                  ? 'bg-sage/15 text-sage-dark dark:text-sage-light'
                  : 'bg-cream-dark/60 text-warm-gray active:bg-cream-dark dark:bg-[#1e2a3a] dark:text-warm-gray-light'
              }`}
            >
              <span>{cat.emoji}</span>
              <span className="truncate">{cat.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      )}

      <RecentChips items={recentItems} onSelect={handleRecentSelect} />

      {error && (
        <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="relative flex items-center gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setShowCategories(!showCategories)
          }}
          className={`press-scale flex h-11 shrink-0 items-center gap-1 rounded-xl px-3 text-sm font-medium active:bg-cream-dark/80 dark:bg-[#1e2a3a] dark:text-warm-gray-light ${
            isSuggested
              ? 'bg-sage/15 text-sage-dark ring-2 ring-sage/30 dark:text-sage-light'
              : 'bg-cream-dark text-warm-gray'
          }`}
          title={isSuggested ? 'Category suggested' : undefined}
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
          onChange={(e) => handleTextChange(e.target.value)}
          onFocus={() => setShowHints(text.trim().length >= 2)}
          onBlur={() => setTimeout(() => setShowHints(false), 150)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleSubmit()
            }
          }}
          placeholder="Add item…"
          enterKeyHint="done"
          className="min-w-0 flex-1 rounded-xl border border-cream-dark bg-cream/50 px-4 py-3 text-base outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 dark:border-[#2d3f54] dark:bg-[#1e2a3a] dark:text-[#e2e8f0]"
        />

        <motion.button
          type="button"
          onClick={handleSubmit}
          disabled={!text.trim() || adding}
          animate={
            reducedMotion || !justAdded
              ? { scale: 1 }
              : { scale: [1, 1.15, 1] }
          }
          transition={springSnappy}
          className="press-scale flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sage text-white disabled:opacity-40 active:bg-sage-dark"
          aria-label="Add item"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M10 4v12M4 10h12" />
          </svg>
        </motion.button>

        {showHints && recentHints.length > 0 && (
          <div className="absolute bottom-full left-14 right-12 z-20 mb-1 overflow-hidden rounded-xl border border-cream-dark bg-white shadow-lg dark:border-[#2d3f54] dark:bg-[#1e2a3a]">
            {recentHints.map((item) => (
              <button
                key={`${item.text}-${item.category}`}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleRecentSelect(item)}
                className="press-scale flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-[#1e293b] active:bg-cream-dark/60 dark:text-[#e2e8f0] dark:active:bg-[#141c27]"
              >
                <span>{getCategoryEmoji(item.category)}</span>
                <span className="truncate">{item.text}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
