import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import type { HomeCategoryId } from '../types'
import {
  DEFAULT_HOME_CATEGORY,
  getHomeCategoryEmoji,
} from '../constants/homeCategories'
import type { ResolvedHomeCategory } from '../lib/homeCategoryConfig'
import { hapticLight } from '../lib/haptics'
import { springSnappy } from '../lib/motion'
import { guessHomeCategory } from '../lib/homeCategoryGuess'
import { saveHomeOverride } from '../lib/homeCategoryOverrides'
import { parseItemText } from '../lib/parseItemText'
import { getRecentHomeItems, type RecentHomeItem } from '../lib/recentItems'
import { CategoryPicker } from './CategoryPicker'
import { Icon } from './Icon'

interface HomeAddItemBarProps {
  listId: string
  categories: ResolvedHomeCategory[]
  onAdd: (text: string, category: HomeCategoryId) => Promise<void>
}

export function HomeAddItemBar({
  listId,
  categories,
  onAdd,
}: HomeAddItemBarProps) {
  const [text, setText] = useState('')
  const [category, setCategory] = useState<HomeCategoryId>(DEFAULT_HOME_CATEGORY)
  const [suggestedCategory, setSuggestedCategory] = useState<HomeCategoryId | null>(
    null,
  )
  const [showCategories, setShowCategories] = useState(false)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [justAdded, setJustAdded] = useState(false)
  const [recentItems, setRecentItems] = useState<RecentHomeItem[]>(() =>
    getRecentHomeItems(listId),
  )
  const [categoryIsManual, setCategoryIsManual] = useState(false)
  const [showHints, setShowHints] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const reducedMotion = useReducedMotion()

  const defaultCategory =
    categories.find((entry) => entry.id === DEFAULT_HOME_CATEGORY)?.id ??
    categories[0]?.id ??
    DEFAULT_HOME_CATEGORY

  const selected =
    categories.find((entry) => entry.id === category) ??
    categories[0] ?? {
      id: DEFAULT_HOME_CATEGORY,
      label: 'Other',
      emoji: '📋',
      visible: true,
    }
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
    setRecentItems(getRecentHomeItems(listId))
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
      saveHomeOverride(listId, parsedText, category)
      setText('')
      setCategoryIsManual(false)
      setSuggestedCategory(null)
      setCategory(defaultCategory)
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
    const guessed = guessHomeCategory(value, listId)
    setSuggestedCategory(guessed)
    if (guessed) setCategory(guessed)
  }

  const handleCategoryPick = (catId: string) => {
    const homeId = catId as HomeCategoryId
    setCategoryIsManual(true)
    setSuggestedCategory(null)
    setCategory(homeId)
    setShowCategories(false)
    if (text.trim()) {
      const { text: parsedText } = parseItemText(text)
      if (parsedText) saveHomeOverride(listId, parsedText, homeId)
    }
  }

  const handleRecentSelect = (item: RecentHomeItem) => {
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
    <div className="relative z-30 border-t border-separator bg-cream px-gutter py-2.5 dark:bg-surface">
      {showCategories && (
        <div onClick={(e) => e.stopPropagation()}>
          <CategoryPicker
            categories={categories}
            selected={category}
            onSelect={handleCategoryPick}
            className="mb-2"
          />
        </div>
      )}

      {error && (
        <p className="mb-2 rounded-[var(--radius-md)] bg-error-banner px-3 py-2 text-footnote">
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
          className={`press-scale flex h-11 shrink-0 items-center gap-1 rounded-[var(--radius-md)] px-2.5 text-footnote font-medium active:bg-cream-dark/80 dark:bg-surface-raised dark:text-warm-gray-light ${
            isSuggested
              ? 'bg-sage/15 text-sage-dark ring-2 ring-sage/30 dark:text-sage-light'
              : 'bg-cream-dark text-warm-gray'
          }`}
        >
          <span>{selected.emoji}</span>
          <Icon name="chevronDown" size="sm" />
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
            placeholder="Fix, buy, or remember at home…"
            enterKeyHint="done"
            className="w-full rounded-[var(--radius-md)] border border-separator bg-grouped px-3 py-2.5 text-input outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 dark:border-border-dark dark:text-ink-dark"
          />

          {showHints && recentHints.length > 0 && (
            <div className="absolute bottom-full left-0 right-0 z-20 mb-1 overflow-hidden rounded-[var(--radius-md)] border border-separator bg-cream shadow-lg dark:bg-surface-raised">
              {recentHints.map((item) => (
                <button
                  key={`${item.text}-${item.category}`}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleRecentSelect(item)}
                  className="press-scale flex w-full items-center gap-2 px-3 py-2 text-left text-body text-ink active:bg-cream-dark/60 dark:text-ink-dark dark:active:bg-surface"
                >
                  <span>{getHomeCategoryEmoji(item.category)}</span>
                  <span className="truncate">{item.text}</span>
                </button>
              ))}
            </div>
          )}
        </div>

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
          className="press-scale flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-sage text-white disabled:opacity-40 active:bg-sage-dark"
          aria-label="Add item"
        >
          <Icon name="add" size="md" />
        </motion.button>
      </div>
    </div>
  )
}
