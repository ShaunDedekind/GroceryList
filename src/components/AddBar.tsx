import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { CategoryId, HomeCategoryId } from '../types'
import { spring, springSnappy } from '../lib/motion'
import { DEFAULT_CATEGORY, getCategoryEmoji } from '../constants/categories'
import { DEFAULT_HOME_CATEGORY, getHomeCategoryEmoji } from '../constants/homeCategories'
import { DEFAULT_HENRY_CATEGORY } from '../constants/henryCategories'
import { hapticLight } from '../lib/haptics'
import {
  extraKeywordsFromResolved,
  guessCategory,
} from '../lib/categoryGuess'
import { guessHomeCategory } from '../lib/homeCategoryGuess'
import { saveOverride } from '../lib/categoryOverrides'
import { saveHomeOverride } from '../lib/homeCategoryOverrides'
import { parseItemText } from '../lib/parseItemText'
import { getRecentItems, getRecentHomeItems } from '../lib/recentItems'
import {
  filterSuggestionsNotLive,
  isLiveSuggestionText,
  normalizeSuggestionText,
  rankSuggestionHints,
  uncheckedTextKeys,
} from '../lib/suggestionFilter'
import { parseNaturalLanguageItem } from '../lib/parseItemClient'
import { ListActionMenu } from './ListActionMenu'
import { CategoryPicker } from './CategoryPicker'
import { Icon } from './Icon'

interface AddCategory {
  id: string
  label: string
  emoji: string
  visible?: boolean
  keywords?: string[]
}

interface AddExtras {
  due_at?: string | null
  note?: string | null
  owner?: import('../types').ItemOwner
  item_kind?: import('../types').ItemKind
  amount_cents?: number | null
  provider?: string | null
  recurrence?: import('../types').RecurrenceRule | null
  source?: import('../types').ItemSource
}

interface RecentEntry {
  text: string
  category: string
}

type AddBarBase = {
  listId: string
  categories: AddCategory[]
  /** Current section items — used to hide suggestions already unchecked on the list. */
  items?: ReadonlyArray<{ text: string; checked: boolean }>
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
    useGroceryGuess: true,
    useHomeGuess: false,
    recents: true,
    dueDate: false,
    menu: true,
    fieldLabel: 'Category',
    fallbackLabel: 'Other',
    fallbackEmoji: '📦',
    naturalLanguage: false,
  },
  home: {
    placeholder: 'e.g. power bill $212 due 28th…',
    defaultCategory: DEFAULT_HOME_CATEGORY,
    useGroceryGuess: false,
    useHomeGuess: true,
    recents: true,
    dueDate: false,
    menu: false,
    fieldLabel: 'Category',
    fallbackLabel: 'Other',
    fallbackEmoji: '📋',
    naturalLanguage: true,
  },
  henry: {
    placeholder: 'e.g. swim lessons Sat 9am weekly…',
    defaultCategory: DEFAULT_HENRY_CATEGORY,
    useGroceryGuess: false,
    useHomeGuess: false,
    recents: false,
    dueDate: true,
    menu: false,
    fieldLabel: 'Type',
    fallbackLabel: 'Other',
    fallbackEmoji: '✨',
    naturalLanguage: true,
  },
} as const

function fromDatetimeLocalValue(value: string): string | null {
  if (!value.trim()) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

function recentEmoji(
  section: AddBarProps['section'],
  category: string,
  categories: AddCategory[],
): string {
  if (section === 'home') return getHomeCategoryEmoji(category as HomeCategoryId)
  const fromList = categories.find((entry) => entry.id === category)
  if (fromList) return fromList.emoji
  return getCategoryEmoji(category as CategoryId)
}

function loadRecents(section: AddBarProps['section'], listId: string): RecentEntry[] {
  if (section === 'grocery') return getRecentItems(listId)
  if (section === 'home') return getRecentHomeItems(listId)
  return []
}

export function AddBar(props: AddBarProps) {
  const { section, listId, categories, onAdd, items = [] } = props
  const config = SECTION_CONFIG[section]
  const reducedMotion = useReducedMotion()
  const [expanded, setExpanded] = useState(false)
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

  const liveKeys = useMemo(() => uncheckedTextKeys(items), [items])

  const menuRecents = useMemo(
    () =>
      filterSuggestionsNotLive(recentItems, liveKeys).map((item) => ({
        text: item.text,
        category: item.category as CategoryId,
      })),
    [recentItems, liveKeys],
  )

  const recentHints = useMemo(() => {
    if (!config.recents) return []
    return rankSuggestionHints(recentItems, text, liveKeys, 5)
  }, [config.recents, text, recentItems, liveKeys])

  const typedIsLive = useMemo(() => {
    if (!config.recents || text.trim().length < 2) return false
    return isLiveSuggestionText(text, liveKeys)
  }, [config.recents, text, liveKeys])

  const hasLiveOnlyMatches = useMemo(() => {
    if (!config.recents || text.trim().length < 2 || recentHints.length > 0) {
      return false
    }
    if (typedIsLive) return true
    const query = normalizeSuggestionText(text)
    return recentItems.some((item) => {
      const key = normalizeSuggestionText(item.text)
      return key.includes(query) && liveKeys.has(key)
    })
  }, [
    config.recents,
    text,
    recentHints.length,
    typedIsLive,
    recentItems,
    liveKeys,
  ])

  const showHintPanel =
    config.recents && showHints && (recentHints.length > 0 || hasLiveOnlyMatches)

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

      if (
        (section === 'home' || section === 'henry') &&
        'naturalLanguage' in config &&
        config.naturalLanguage
      ) {
        const { parsed } = await parseNaturalLanguageItem(parsedText, section)
        const nextCategory =
          categories.find((entry) => entry.id === parsed.category)?.id ??
          category
        const manualDue = fromDatetimeLocalValue(dueLocal)
        await onAdd(parsed.title || parsedText, nextCategory, {
          due_at: manualDue ?? parsed.due_at ?? null,
          note: parsed.note ?? null,
          owner: parsed.owner,
          item_kind: parsed.item_kind,
          amount_cents: parsed.amount_cents ?? null,
          provider: parsed.provider ?? null,
          recurrence: parsed.recurrence ?? null,
          source: 'nl',
        })
        if (section === 'home') {
          persistOverride(parsed.title || parsedText, nextCategory)
          refreshRecent()
        }
        setDueLocal('')
        setShowDue(false)
      } else if (section === 'henry') {
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
      setExpanded(false)
      setShowCategories(false)
      setShowDue(false)
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

  const collapse = useCallback(() => {
    setExpanded(false)
    setShowCategories(false)
    setShowHints(false)
    setShowDue(false)
    setMenuOpen(false)
    setError(null)
  }, [])

  useEffect(() => {
    if (!expanded) return
    const id = window.setTimeout(() => inputRef.current?.focus(), 180)
    return () => window.clearTimeout(id)
  }, [expanded])

  useEffect(() => {
    if (!expanded) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') collapse()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [expanded, collapse])

  const handleTextChange = (value: string) => {
    setText(value)
    if (config.recents) setShowHints(value.trim().length >= 2)
    if (categoryIsManual) return

    let guessed: string | null = null
    if (config.useGroceryGuess) {
      guessed = guessCategory(value, {
        listId,
        extraKeywords: extraKeywordsFromResolved(categories),
        knownIds: new Set(categories.map((category) => category.id)),
      })
    } else if (config.useHomeGuess) {
      guessed = guessHomeCategory(value, listId)
    }

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

  const handleRecentAdd = async (item: RecentEntry) => {
    if (isLiveSuggestionText(item.text, liveKeys) || adding) return
    setShowHints(false)
    setShowCategories(false)
    setAdding(true)
    setError(null)
    try {
      await onAdd(item.text, item.category)
      persistOverride(item.text, item.category)
      refreshRecent()
      setText('')
      setCategoryIsManual(false)
      setSuggestedCategory(null)
      setCategory(defaultCategory)
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
      className="pointer-events-none absolute inset-x-0 bottom-0 z-30 safe-bottom px-gutter pb-3 pt-2"
    >
      <AnimatePresence mode="wait" initial={false}>
        {!expanded ? (
          <motion.button
            key="fab"
            type="button"
            layout
            initial={reducedMotion ? false : { opacity: 0, scale: 0.85, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reducedMotion ? undefined : { opacity: 0, scale: 0.9, y: 8 }}
            transition={reducedMotion ? { duration: 0 } : spring}
            onClick={() => setExpanded(true)}
            className="pointer-events-auto ml-auto flex h-12 min-w-12 items-center gap-2 rounded-full bg-ink px-5 text-cream shadow-card dark:bg-attention dark:text-ink"
            aria-label="Add item"
          >
            <Icon name="add" size="md" />
            <span className="font-mono text-meta font-semibold tracking-[0.12em]">
              Add
            </span>
          </motion.button>
        ) : (
          <motion.div
            key="composer"
            layout
            initial={reducedMotion ? false : { opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? undefined : { opacity: 0, y: 16, scale: 0.98 }}
            transition={reducedMotion ? { duration: 0 } : spring}
            className="pointer-events-auto overflow-hidden rounded-[var(--radius-lg)] border border-line bg-surface-strong p-2 shadow-card backdrop-blur-xl"
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
              <button
                type="button"
                onClick={collapse}
                aria-label="Close add"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full surface-soft text-warm-gray active:opacity-70 dark:text-warm-gray-light"
              >
                <Icon name="close" size="sm" />
              </button>

              <div className="relative min-w-0 flex-1">
                <div
                  className={`flex h-11 items-center gap-1.5 rounded-full border bg-cream pl-1.5 pr-3 dark:bg-surface-raised ${
                    justAdded
                      ? 'border-attention ring-2 ring-attention/20'
                      : 'border-line focus-within:border-ink/30 focus-within:ring-2 focus-within:ring-ink/10'
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
                        ? 'bg-attention/15 text-attention'
                        : 'text-warm-gray dark:text-warm-gray-light'
                    }`}
                    title={
                      isSuggested
                        ? 'Category suggested'
                        : `Change ${config.fieldLabel.toLowerCase()}`
                    }
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

                {showHintPanel && (
                  <div className="absolute bottom-full left-0 right-0 z-20 mb-1 overflow-hidden rounded-[var(--radius-md)] border border-separator bg-cream shadow-lg dark:bg-surface-raised">
                    {hasLiveOnlyMatches && recentHints.length === 0 ? (
                      <p className="flex min-h-11 items-center px-3 text-body text-warm-gray dark:text-warm-gray-light">
                        Already on list
                      </p>
                    ) : (
                      recentHints.map((item) => (
                        <button
                          key={`${item.text}-${item.category}`}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => void handleRecentAdd(item)}
                          disabled={adding}
                          className="flex min-h-11 w-full items-center gap-2 px-3 text-left text-body text-ink active:bg-cream-dark/60 disabled:opacity-50 dark:text-ink-dark dark:active:bg-surface"
                        >
                          <span>
                            {recentEmoji(section, item.category, categories)}
                          </span>
                          <span className="min-w-0 flex-1 truncate">
                            {item.text}
                          </span>
                          <span className="shrink-0 text-meta font-semibold text-attention">
                            Add
                          </span>
                        </button>
                      ))
                    )}
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
                    recentItems={menuRecents}
                    getEmoji={(category) =>
                      recentEmoji(section, category, categories)
                    }
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
                      ? 'bg-attention/15 text-attention'
                      : 'surface-soft text-warm-gray dark:text-warm-gray-light'
                  }`}
                >
                  <Icon name="calendar" size="sm" />
                </button>
              )}

              <motion.button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={adding || !text.trim()}
                whileTap={reducedMotion ? undefined : { scale: 0.96 }}
                transition={springSnappy}
                className="flex h-11 shrink-0 items-center rounded-full bg-ink px-4 font-mono text-meta font-semibold tracking-[0.08em] text-cream disabled:opacity-40 dark:bg-attention dark:text-ink"
              >
                Save
              </motion.button>
            </div>

            {config.dueDate && duePreview && !showDue && (
              <p className="mt-1 px-1 text-meta text-warm-gray-light">
                Due {duePreview}
                {' · '}
                <button
                  type="button"
                  className="min-h-11 font-semibold text-attention"
                  onClick={() => setShowDue(true)}
                >
                  Edit
                </button>
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
