import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import type { HomeCategoryId } from '../types'
import {
  DEFAULT_HOME_CATEGORY,
  getHomeCategoryEmoji,
} from '../constants/homeCategories'
import type { ResolvedHomeCategory } from '../lib/homeCategoryConfig'
import { hapticLight } from '../lib/haptics'
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
  const barRef = useRef<HTMLDivElement>(null)

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
    setShowCategories(false)
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
      setTimeout(() => setJustAdded(false), 450)
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
    inputRef.current?.focus()
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
    if (!showCategories) return
    const handleClick = (event: MouseEvent) => {
      if (barRef.current?.contains(event.target as Node)) return
      setShowCategories(false)
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [showCategories])

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
              className={`press-scale flex h-8 shrink-0 items-center gap-0.5 rounded-full px-2 text-meta font-medium ${
                isSuggested
                  ? 'bg-sage/15 text-sage-dark dark:text-sage-light'
                  : 'text-warm-gray dark:text-warm-gray-light'
              }`}
              aria-label={`Category ${selected.label}`}
              aria-expanded={showCategories}
            >
              <span>{selected.emoji}</span>
              <Icon name="chevronDown" size="sm" />
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
              placeholder="Fix, buy, or remember at home…"
              enterKeyHint="done"
              disabled={adding}
              className="min-w-0 flex-1 bg-transparent text-input outline-none dark:text-ink-dark"
            />
          </div>

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
      </div>
    </div>
  )
}
