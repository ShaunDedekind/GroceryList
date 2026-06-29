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
import { ListActionMenu } from './ListActionMenu'

interface AddItemBarProps {
  listId: string
  onAdd: (text: string, category: CategoryId) => Promise<void>
  onPaste: () => void
  onShare: () => void
  onStartReorder: () => void
  onToggleShopMode: () => void
  reorderMode: boolean
  shopMode: boolean
}

export function AddItemBar({
  listId,
  onAdd,
  onPaste,
  onShare,
  onStartReorder,
  onToggleShopMode,
  reorderMode,
  shopMode,
}: AddItemBarProps) {
  const [text, setText] = useState('')
  const [category, setCategory] = useState<CategoryId>(DEFAULT_CATEGORY)
  const [suggestedCategory, setSuggestedCategory] = useState<CategoryId | null>(null)
  const [showCategories, setShowCategories] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [justAdded, setJustAdded] = useState(false)
  const [recentItems, setRecentItems] = useState<RecentItem[]>(() =>
    getRecentItems(listId),
  )
  const [categoryIsManual, setCategoryIsManual] = useState(false)
  const [showHints, setShowHints] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const moreButtonRef = useRef<HTMLButtonElement>(null)
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

  const handleRecentAdd = async (item: RecentItem) => {
    try {
      await onAdd(item.text, item.category)
      saveOverride(listId, item.text, item.category)
      refreshRecent()
      hapticLight()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add item')
    }
  }

  useEffect(() => {
    if (showCategories) return
    const handleClick = () => setShowCategories(false)
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [showCategories])

  useEffect(() => {
    if (!menuOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [menuOpen])

  return (
    <div className="safe-bottom relative z-30 border-t border-cream-dark bg-white/90 px-4 py-2.5 backdrop-blur-lg dark:border-border-dark dark:bg-surface/90">
      {showCategories && (
        <div
          className="mb-2 grid grid-cols-3 gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategoryPick(cat.id)}
              className={`press-scale flex items-center gap-1 rounded-xl px-2 py-2 text-meta font-medium transition-colors ${
                category === cat.id
                  ? 'bg-sage/15 text-sage-dark dark:text-sage-light'
                  : 'bg-cream-dark/60 text-warm-gray active:bg-cream-dark dark:bg-surface-raised dark:text-warm-gray-light'
              }`}
            >
              <span>{cat.emoji}</span>
              <span className="truncate">{cat.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-meta text-red-600 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setShowCategories(!showCategories)
            setMenuOpen(false)
          }}
          className={`press-scale flex h-10 shrink-0 items-center gap-1 rounded-xl px-2.5 text-meta font-medium active:bg-cream-dark/80 dark:bg-surface-raised dark:text-warm-gray-light ${
            isSuggested
              ? 'bg-sage/15 text-sage-dark ring-2 ring-sage/30 dark:text-sage-light'
              : 'bg-cream-dark text-warm-gray'
          }`}
          title={isSuggested ? 'Category suggested' : undefined}
        >
          <span>{selected.emoji}</span>
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 4.5l3 3 3-3" />
          </svg>
        </button>

        <div className="relative min-w-0 flex-1">
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
            className="w-full rounded-xl border border-cream-dark bg-cream/50 px-3 py-2.5 text-body outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 dark:border-border-dark dark:bg-surface-raised dark:text-ink-dark"
          />

          {showHints && recentHints.length > 0 && (
            <div className="absolute bottom-full left-0 right-0 z-20 mb-1 overflow-hidden rounded-xl border border-cream-dark bg-white shadow-lg dark:border-border-dark dark:bg-surface-raised">
              {recentHints.map((item) => (
                <button
                  key={`${item.text}-${item.category}`}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleRecentSelect(item)}
                  className="press-scale flex w-full items-center gap-2 px-3 py-2 text-left text-body text-ink active:bg-cream-dark/60 dark:text-ink-dark dark:active:bg-surface"
                >
                  <span>{getCategoryEmoji(item.category)}</span>
                  <span className="truncate">{item.text}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          ref={moreButtonRef}
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setMenuOpen((open) => !open)
            setShowCategories(false)
          }}
          aria-label="More actions"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          className={`press-scale flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-warm-gray active:bg-cream-dark/80 dark:text-warm-gray-light dark:active:bg-surface-raised ${
            reorderMode || shopMode
              ? 'bg-sage/15 ring-2 ring-sage/30 text-sage dark:text-sage-light'
              : 'bg-cream-dark dark:bg-surface-raised'
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
            <circle cx="4" cy="9" r="1.5" />
            <circle cx="9" cy="9" r="1.5" />
            <circle cx="14" cy="9" r="1.5" />
          </svg>
        </button>

        <ListActionMenu
          open={menuOpen}
          reorderMode={reorderMode}
          shopMode={shopMode}
          anchorRef={moreButtonRef}
          recentItems={recentItems}
          onClose={() => setMenuOpen(false)}
          onPaste={onPaste}
          onShare={onShare}
          onStartReorder={onStartReorder}
          onToggleShopMode={onToggleShopMode}
          onRecentAdd={handleRecentAdd}
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
          className="press-scale flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sage text-white disabled:opacity-40 active:bg-sage-dark"
          aria-label="Add item"
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M10 4v12M4 10h12" />
          </svg>
        </motion.button>
      </div>
    </div>
  )
}
