import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import type { CategoryId, HomeCategoryId } from '../types'
import { DEFAULT_CATEGORY, getCategoryEmoji } from '../constants/categories'
import { DEFAULT_HOME_CATEGORY, getHomeCategoryEmoji } from '../constants/homeCategories'
import { DEFAULT_HENRY_CATEGORY } from '../constants/henryCategories'
import { hapticLight } from '../lib/haptics'
import { guessCategory } from '../lib/categoryGuess'
import { guessHomeCategory } from '../lib/homeCategoryGuess'
import { saveOverride } from '../lib/categoryOverrides'
import { saveHomeOverride } from '../lib/homeCategoryOverrides'
import { parseItemText } from '../lib/parseItemText'
import { getRecentItems, getRecentHomeItems } from '../lib/recentItems'
import { ListActionMenu } from './ListActionMenu'
import { CategoryPicker } from './CategoryPicker'
import { Icon } from './Icon'

interface AddCategory {
  id: string
  label: string
  emoji: string
  visible?: boolean
}

interface AddExtras {
  due_at?: string | null
  note?: string | null
}

interface RecentEntry {
  text: string
  category: string
}

type AddBarBase = {
  listId: string
  categories: AddCategory[]
  onAdd: (text: string, category: string, extras?: AddExtras) => Promise<void>
}

type AddBarProps = AddBarBase &
  (
    | {
        section: 'grocery'
        onPaste: () => void
        onShare: () => void
        onStartReorder: () => void
        onToggleShopMode: () => void
        reorderMode: boolean
        shopMode: boolean
      }
    | { section: 'home' }
    | { section: 'henry' }
  )

const SECTION_CONFIG = {
  grocery: {
    placeholder: 'Add item…',
    defaultCategory: DEFAULT_CATEGORY,
    guess: guessCategory as (value: string, listId: string) => string | null,
    recents: true,
    dueDate: false,
    menu: true,
    fieldLabel: 'Category',
    fallbackLabel: 'Other',
    fallbackEmoji: '📦',
  },
  home: {
    placeholder: 'Fix, buy, or remember at home…',
    defaultCategory: DEFAULT_HOME_CATEGORY,
    guess: guessHomeCategory as (value: string, listId: string) => string | null,
    recents: true,
    dueDate: false,
    menu: false,
    fieldLabel: 'Category',
    fallbackLabel: 'Other',
    fallbackEmoji: '📋',
  },
  henry: {
    placeholder: 'Something for Henry…',
    defaultCategory: DEFAULT_HENRY_CATEGORY,
    guess: null,
    recents: false,
    dueDate: true,
    menu: false,
    fieldLabel: 'Type',
    fallbackLabel: 'Other',
    fallbackEmoji: '✨',
  },
} as const

function fromDatetimeLocalValue(value: string): string | null {
  if (!value.trim()) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

function recentEmoji(section: AddBarProps['section'], category: string): string {
  if (section === 'home') return getHomeCategoryEmoji(category as HomeCategoryId)
  return getCategoryEmoji(category as CategoryId)
}

function loadRecents(section: AddBarProps['section'], listId: string): RecentEntry[] {
  if (section === 'grocery') return getRecentItems(listId)
  if (section === 'home') return getRecentHomeItems(listId)
  return []
}

export function AddBar(props: AddBarProps) {
  const { section, listId, categories, onAdd } = props
  const config = SECTION_CONFIG[section]
  const [text, setText] = useState('')
  const [category, setCategory] = useState<string>(config.defaultCategory)
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null)
  const [showCategories, setShowCategories] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [justAdded, setJustAdded] = useState(false)
  const [recentItems, setRecentItems] = useState<RecentEntry[]>(() =>
    config.recents ? loadRecents(section, listId) : [],
  )
  const [categoryIsManual, setCategoryIsManual] = useState(false)
  const [showHints, setShowHints] = useState(false)
  const [dueLocal, setDueLocal] = useState('')
  const [showDue, setShowDue] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const moreButtonRef = useRef<HTMLButtonElement>(null)
  const barRef = useRef<HTMLDivElement>(null)

  const defaultCategory =
    categories.find((entry) => entry.id === config.defaultCategory)?.id ??
    categories[0]?.id ??
    config.defaultCategory

  const selected = categories.find((entry) => entry.id === category) ??
    categories[0] ?? {
      id: config.defaultCategory,
      label: config.fallbackLabel,
      emoji: config.fallbackEmoji,
      visible: true,
    }
  const isSuggested =
    suggestedCategory !== null && category === suggestedCategory && !categoryIsManual

  const recentHints = useMemo(() => {
    if (!config.recents || text.trim().length < 2) return []
    const prefix = text.trim().toLowerCase()
    return recentItems
      .filter((item) => item.text.toLowerCase().startsWith(prefix))
      .slice(0, 5)
  }, [config.recents, text, recentItems])

  const refreshRecent = useCallback(() => {
    if (!config.recents) return
    setRecentItems(loadRecents(section, listId))
  }, [config.recents, section, listId])

  const persistOverride = (value: string, categoryId: string) => {
    if (section === 'grocery') saveOverride(listId, value, categoryId as CategoryId)
    else if (section === 'home') {
      saveHomeOverride(listId, value, categoryId as HomeCategoryId)
    }
  }

  const handleSubmit = async () => {
    if (!text.trim() || adding) return
    setAdding(true)
    setError(null)
    setShowHints(false)
    setShowCategories(false)
    try {
      const parsedText = config.dueDate ? text.trim() : parseItemText(text).text
      if (!parsedText) return

      if (section === 'henry') {
        await onAdd(parsedText, category, {
          due_at: fromDatetimeLocalValue(dueLocal),
        })
        setDueLocal('')
        setShowDue(false)
      } else {
        await onAdd(parsedText, category)
        persistOverride(parsedText, category)
        refreshRecent()
      }

      setText('')
      setCategoryIsManual(false)
      setSuggestedCategory(null)
      setCategory(defaultCategory)
      hapticLight()
      setJustAdded(true)
      setTimeout(() => setJustAdded(false), 450)
      inputRef.current?.focus()
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : section === 'henry'
            ? 'Failed to add task'
            : 'Failed to add item',
      )
    } finally {
      setAdding(false)
    }
  }

  const handleTextChange = (value: string) => {
    setText(value)
    if (config.recents) setShowHints(value.trim().length >= 2)
    if (!config.guess || categoryIsManual) return
    const guessed = config.guess(value, listId)
    setSuggestedCategory(guessed)
    if (guessed) setCategory(guessed)
  }

  const handleCategoryPick = (catId: string) => {
    setCategoryIsManual(section !== 'henry')
    setSuggestedCategory(null)
    setCategory(catId)
    setShowCategories(false)
    if (section !== 'henry' && text.trim()) {
      const parsedText = parseItemText(text).text
      if (parsedText) persistOverride(parsedText, catId)
    }
    inputRef.current?.focus()
  }

  const handleRecentSelect = (item: RecentEntry) => {
    setCategoryIsManual(true)
    setSuggestedCategory(null)
    setText(item.text)
    setCategory(item.category)
    setShowHints(false)
    inputRef.current?.focus()
  }

  const handleRecentAdd = async (item: RecentEntry) => {
    try {
      await onAdd(item.text, item.category)
      persistOverride(item.text, item.category)
      refreshRecent()
      hapticLight()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add item')
    }
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

  useEffect(() => {
    if (!config.menu || !menuOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [config.menu, menuOpen])

  const duePreview = dueLocal
    ? new Date(dueLocal).toLocaleString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : null

  const menu = section === 'grocery' ? props : null

  return (
    <div
      ref={barRef}
      className="relative z-30 border-t border-line bg-surface-strong px-gutter py-1.5 backdrop-blur-xl"
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

      {config.dueDate && showDue && (
        <div className="mb-1.5 flex items-center gap-2">
          <input
            type="datetime-local"
            value={dueLocal}
            onChange={(e) => setDueLocal(e.target.value)}
            className="min-h-11 min-w-0 flex-1 rounded-full border border-line bg-cream px-3 text-input outline-none focus:border-sage/40 dark:bg-surface-raised dark:text-ink-dark"
          />
          {dueLocal && (
            <button
              type="button"
              onClick={() => setDueLocal('')}
              className="hit-touch text-meta text-warm-gray-light"
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
            className={`flex h-11 items-center gap-1.5 rounded-full border bg-cream pl-1.5 pr-3 dark:bg-surface-raised ${
              justAdded
                ? 'border-sage ring-2 ring-sage/20'
                : 'border-line focus-within:border-sage/40 focus-within:ring-2 focus-within:ring-sage/20'
            }`}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setShowCategories(!showCategories)
                setMenuOpen(false)
              }}
              className={`flex h-11 min-w-11 shrink-0 items-center gap-0.5 rounded-full px-2 text-meta font-medium active:opacity-70 ${
                isSuggested
                  ? 'bg-sage/15 text-sage-dark dark:text-sage-light'
                  : 'text-warm-gray dark:text-warm-gray-light'
              }`}
              title={isSuggested ? 'Category suggested' : `Change ${config.fieldLabel.toLowerCase()}`}
              aria-label={`${config.fieldLabel} ${selected.label}`}
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
              onFocus={() => {
                if (config.recents) setShowHints(text.trim().length >= 2)
              }}
              onBlur={() => setTimeout(() => setShowHints(false), 150)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  void handleSubmit()
                }
              }}
              placeholder={config.placeholder}
              enterKeyHint="done"
              disabled={adding}
              className="min-w-0 flex-1 bg-transparent text-input outline-none dark:text-ink-dark"
            />
          </div>

          {config.recents && showHints && recentHints.length > 0 && (
            <div className="absolute bottom-full left-0 right-0 z-20 mb-1 overflow-hidden rounded-[var(--radius-md)] border border-separator bg-cream shadow-lg dark:bg-surface-raised">
              {recentHints.map((item) => (
                <button
                  key={`${item.text}-${item.category}`}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleRecentSelect(item)}
                  className="flex min-h-11 w-full items-center gap-2 px-3 text-left text-body text-ink active:bg-cream-dark/60 dark:text-ink-dark dark:active:bg-surface"
                >
                  <span>{recentEmoji(section, item.category)}</span>
                  <span className="truncate">{item.text}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {config.menu && menu && (
          <>
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
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-warm-gray active:opacity-70 dark:text-warm-gray-light ${
                menu.reorderMode || menu.shopMode
                  ? 'bg-sage/15 text-sage ring-2 ring-sage/30 dark:text-sage-light'
                  : 'surface-soft'
              }`}
            >
              <Icon name="more" size="md" />
            </button>

            <ListActionMenu
              open={menuOpen}
              reorderMode={menu.reorderMode}
              shopMode={menu.shopMode}
              anchorRef={moreButtonRef}
              recentItems={recentItems.map((item) => ({
                text: item.text,
                category: item.category as CategoryId,
              }))}
              onClose={() => setMenuOpen(false)}
              onPaste={menu.onPaste}
              onShare={menu.onShare}
              onStartReorder={menu.onStartReorder}
              onToggleShopMode={menu.onToggleShopMode}
              onRecentAdd={(item) => void handleRecentAdd(item)}
            />
          </>
        )}

        {config.dueDate && (
          <button
            type="button"
            onClick={() => setShowDue((open) => !open)}
            aria-label="Set due date"
            aria-expanded={showDue}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full active:opacity-70 ${
              dueLocal || showDue
                ? 'bg-sage/15 text-sage'
                : 'surface-soft text-warm-gray dark:text-warm-gray-light'
            }`}
          >
            <Icon name="calendar" size="sm" />
          </button>
        )}
      </div>

      {config.dueDate && duePreview && !showDue && (
        <p className="mt-1 px-1 text-meta text-warm-gray-light">
          Due {duePreview}
          {' · '}
          <button
            type="button"
            className="min-h-11 font-semibold text-sage"
            onClick={() => setShowDue(true)}
          >
            Edit
          </button>
        </p>
      )}
    </div>
  )
}
