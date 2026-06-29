import { useCallback, useEffect, useState } from 'react'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import type { CategoryId } from '../types'
import { getCategoryEmoji } from '../constants/categories'
import { hapticLight } from '../lib/haptics'
import {
  needsSmartParse,
  normalizeParsedItems,
  parseLocally,
  type ParsedItem,
} from '../lib/parseItems'
import { parseItemsWithAI } from '../lib/supabase'

interface PasteSheetProps {
  listId: string
  onAddItems: (items: { text: string; category: CategoryId }[]) => Promise<number>
  onClose: () => void
}

export function PasteSheet({ listId, onAddItems, onClose }: PasteSheetProps) {
  useBodyScrollLock(true)
  const [text, setText] = useState('')
  const [preview, setPreview] = useState<ParsedItem[]>([])
  const [adding, setAdding] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [usedAi, setUsedAi] = useState(false)

  const runLocalParse = useCallback(
    (value: string) => {
      const items = parseLocally(value, listId)
      setPreview(items)
      setUsedAi(false)
      return items
    },
    [listId],
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      runLocalParse(text)
    }, 300)
    return () => clearTimeout(timer)
  }, [text, runLocalParse])

  const showSmartParse = text.trim().length > 0 && needsSmartParse(text, preview)

  const handleSmartParse = async () => {
    if (!text.trim() || parsing) return
    setParsing(true)
    setError(null)
    try {
      const items = normalizeParsedItems(await parseItemsWithAI(text))
      setPreview(items)
      setUsedAi(true)
      hapticLight()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Smart parse failed')
    } finally {
      setParsing(false)
    }
  }

  const handleAddAll = async () => {
    if (preview.length === 0 || adding) return
    setAdding(true)
    setError(null)
    try {
      await onAddItems(preview)
      hapticLight()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add items')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="safe-bottom flex max-h-[85dvh] w-full max-w-lg flex-col rounded-t-3xl bg-white px-5 pb-6 pt-5 shadow-lg dark:bg-surface-raised"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-10 shrink-0 rounded-full bg-cream-dark dark:bg-border-dark" />

        <h3 className="text-title font-semibold text-ink dark:text-ink-dark">
          Paste items
        </h3>
        <p className="mt-1 text-meta text-warm-gray dark:text-warm-gray-light">
          Paste a recipe — we&apos;ll pull out the ingredients so you can tick off what you already have
        </p>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="eggs, bread, chicken thighs&#10;or paste a recipe…"
          rows={4}
          className="mt-3 w-full resize-none rounded-xl border border-cream-dark bg-cream/50 px-3 py-2.5 text-body outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 dark:border-border-dark dark:bg-surface dark:text-ink-dark"
        />

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
            {error}
          </p>
        )}

        {preview.length > 0 && (
          <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
            <p className="mb-2 text-meta font-medium text-warm-gray dark:text-warm-gray-light">
              Preview ({preview.length} item{preview.length === 1 ? '' : 's'})
              {usedAi && (
                <span className="ml-2 text-sage dark:text-sage-light">· Smart parsed</span>
              )}
            </p>
            <ul className="space-y-1.5">
              {preview.map((item, i) => (
                <li
                  key={`${item.text}-${item.category}-${i}`}
                  className="flex items-center gap-2 rounded-lg bg-cream-dark/50 px-2.5 py-1.5 text-body dark:bg-surface"
                >
                  <span>{getCategoryEmoji(item.category)}</span>
                  <span className="truncate text-ink dark:text-ink-dark">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-4 shrink-0 space-y-3">
          {showSmartParse && (
            <button
              type="button"
              onClick={handleSmartParse}
              disabled={!text.trim() || parsing}
              className="press-scale w-full rounded-2xl border border-sage/40 py-2.5 text-sm font-medium text-sage active:bg-sage/10 disabled:opacity-40 dark:text-sage-light"
            >
              {parsing ? 'Parsing…' : 'Smart parse'}
            </button>
          )}

          <button
            type="button"
            onClick={handleAddAll}
            disabled={preview.length === 0 || adding}
            className="press-scale w-full rounded-2xl bg-sage py-2.5 text-sm font-semibold text-white active:bg-sage-dark disabled:opacity-40"
          >
            {adding ? 'Adding…' : `Add all${preview.length > 0 ? ` (${preview.length})` : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}
