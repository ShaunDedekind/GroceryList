import { useRef, useState, useMemo, useCallback } from 'react'
import { AnimatePresence } from 'motion/react'
import type { Session, GroceryItem, HenryCategoryId } from '../types'
import {
  getHenryCategoryEmoji,
  getHenryCategoryLabel,
  isHenryCategoryId,
} from '../constants/henryCategories'
import { useItems } from '../hooks/useItems'
import { useCategoryConfig } from '../hooks/useCategoryConfig'
import type { ResolvedHenryCategory } from '../lib/henryCategoryConfig'
import {
  formatDueLabel,
  groupHenryItems,
  type HenryBucketId,
} from '../lib/henryBuckets'
import { parseItemDisplay } from '../lib/itemNote'
import { useLingeringChecked } from '../hooks/useLingeringChecked'
import { useUndoAction } from '../hooks/useUndoAction'
import { ItemRow } from './ItemRow'
import { AddBar } from './AddBar'
import { ItemEditSheet } from './ItemEditSheet'
import { SkeletonList } from './SkeletonList'
import { UndoToast } from './UndoToast'
import { CompactTitleBar, LargeTitle } from './ScreenHeader'
import { listCountLabel, useCompactTitle } from '../hooks/useCompactTitle'

interface HenryTabProps {
  session: Session
  showDone: boolean
  onShowDoneChange: (show: boolean) => void
  onRemoteInsert: (item: GroceryItem) => void
  active: boolean
  onOpenSettings: () => void
}

const BUCKET_EMOJI: Record<HenryBucketId, string> = {
  overdue: '⏰',
  today: '☀️',
  this_week: '📅',
  later: '🗓️',
  someday: '💭',
}

export function HenryTab({
  session,
  showDone,
  onShowDoneChange,
  onRemoteInsert,
  active,
  onOpenSettings,
}: HenryTabProps) {
  const mainRef = useRef<HTMLElement | null>(null)
  const titleRef = useRef<HTMLDivElement | null>(null)
  const {
    items,
    loading,
    error,
    addItem,
    toggleItem,
    updateItem,
    deleteItem,
  } = useItems(session, { section: 'henry', onRemoteInsert, active })
  const compactTitle = useCompactTitle(mainRef, titleRef)
  const { lingeringIds, retain, release } = useLingeringChecked(showDone)
  const undo = useUndoAction()
  const { visibleCategories } = useCategoryConfig(session.listId, 'henry')

  const [editingItem, setEditingItem] = useState<GroceryItem | null>(null)

  const buckets = useMemo(() => {
    const source = items
      .filter((item) => !undo.hiddenIds.has(item.id))
      .map((item) =>
        lingeringIds.has(item.id) && item.checked
          ? { ...item, checked: false }
          : item,
      )
    const grouped = groupHenryItems(source, { showDone })
    const byId = new Map(items.map((item) => [item.id, item]))
    return grouped.map((bucket) => ({
      ...bucket,
      items: bucket.items
        .map((item) => byId.get(item.id) ?? item)
        .filter((item) => !undo.hiddenIds.has(item.id)),
    }))
  }, [items, showDone, undo.hiddenIds, lingeringIds])
  const uncheckedCount = items.filter((i) => !i.checked).length
  const checkedCount = items.filter((i) => i.checked).length
  const subtitle = listCountLabel(uncheckedCount, 'todo', 'All clear', loading)

  const handleToggle = useCallback(
    (id: string, checked: boolean) => {
      if (checked) {
        if (!showDone) retain(id)
      } else {
        release(id)
      }
      return toggleItem(id, checked)
    },
    [showDone, retain, release, toggleItem],
  )

  const requestDelete = useCallback(
    (id: string) => {
      const item = items.find((entry) => entry.id === id)
      if (!item) return
      const { title } = parseItemDisplay(item.text)
      undo.schedule({
        message: `Deleted '${title}'`,
        itemIds: [id],
        commit: () => deleteItem(id),
      })
    },
    [items, undo, deleteItem],
  )

  const handleAdd = useCallback(
    async (
      text: string,
      category: HenryCategoryId,
      extras?: { due_at?: string | null; note?: string | null },
    ) => {
      await addItem(text, category, extras)
    },
    [addItem],
  )

  const handleSaveItem = async (
    id: string,
    payload: {
      text: string
      category: string
      due_at?: string | null
      note?: string | null
    },
  ) => {
    await updateItem(id, {
      text: payload.text,
      category: payload.category as HenryCategoryId,
      due_at: payload.due_at,
      note: payload.note,
    })
  }

  const typeChipFor = (item: GroceryItem) => {
    const id = isHenryCategoryId(item.category) ? item.category : 'other'
    return {
      emoji: getHenryCategoryEmoji(id),
      label: getHenryCategoryLabel(id),
    }
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <CompactTitleBar
        title="Henry"
        visible={compactTitle}
        onOpenSettings={onOpenSettings}
      />

      <main
        ref={mainRef}
        className="relative flex-1 overflow-y-auto pb-2"
      >
        <LargeTitle
          titleRef={titleRef}
          title="Henry"
          subtitle={subtitle}
          onOpenSettings={onOpenSettings}
        />

        {error && (
          <p className="mx-gutter mb-3 rounded-[var(--radius-md)] bg-error-banner px-3 py-2 text-footnote">
            Couldn&apos;t sync — retrying
          </p>
        )}

        {loading ? (
          <SkeletonList />
        ) : items.length === 0 ? (
          <div className="px-gutter py-8">
            <p className="text-body text-ink dark:text-ink-dark">
              Nothing for Henry yet
            </p>
            <p className="mt-1 text-footnote text-warm-gray dark:text-warm-gray-light">
              Add something in the bar below
            </p>
          </div>
        ) : (
          <>
            {buckets.map((bucket) => {
              const count =
                bucket.items.filter((item) => !item.checked).length ||
                bucket.items.length
              return (
                <section key={bucket.id} className="mb-6">
                  <h2 className="mb-1.5 flex items-baseline gap-1.5 px-gutter text-meta font-semibold text-warm-gray dark:text-warm-gray-light">
                    <span aria-hidden="true">{BUCKET_EMOJI[bucket.id]}</span>
                    <span>{bucket.label}</span>
                    <span>{count}</span>
                  </h2>
                  <div className="mx-gutter overflow-hidden rounded-[var(--radius-md)] bg-cream dark:bg-surface-raised">
                    <AnimatePresence initial={false}>
                      {bucket.items.map((item, index) => (
                        <ItemRow
                          key={item.id}
                          item={item}
                          currentUserName={session.displayName}
                          onToggle={handleToggle}
                          onDelete={requestDelete}
                          onEdit={setEditingItem}
                          showSeparator={index < bucket.items.length - 1}
                          dueLabel={formatDueLabel(item.due_at)}
                          typeChip={typeChipFor(item)}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </section>
              )
            })}

            {checkedCount > 0 && (
              <div className="mt-2 flex items-center gap-3 px-gutter pb-2">
                <button
                  type="button"
                  onClick={() => onShowDoneChange(!showDone)}
                  className="min-h-11 text-meta font-medium text-sage active:text-sage-dark"
                >
                  {showDone ? 'Hide done' : `Show done (${checkedCount})`}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {undo.message && <UndoToast message={undo.message} onUndo={undo.undo} />}

      <AddBar
        section="henry"
        listId={session.listId}
        categories={visibleCategories as ResolvedHenryCategory[]}
        onAdd={(text, category, extras) =>
          handleAdd(text, category as HenryCategoryId, extras)
        }
      />

      {editingItem && (
        <ItemEditSheet
          item={editingItem}
          listId={session.listId}
          categories={visibleCategories as ResolvedHenryCategory[]}
          onSave={handleSaveItem}
          onClose={() => setEditingItem(null)}
          getCategoryLabel={(id) => getHenryCategoryLabel(id as HenryCategoryId)}
          getCategoryEmoji={(id) => getHenryCategoryEmoji(id as HenryCategoryId)}
          showScheduleFields
          categoryLabel="Type"
        />
      )}
    </div>
  )
}
