import { useRef, useState, useMemo, useCallback } from 'react'
import type { Session, GroceryItem, HomeCategoryId } from '../types'
import {
  getHomeCategoryEmoji,
  getHomeCategoryLabel,
  normalizeHomeCategoryId,
} from '../constants/homeCategories'
import { saveHomeOverride } from '../lib/homeCategoryOverrides'
import { useItems } from '../hooks/useItems'
import { useCategoryConfig } from '../hooks/useCategoryConfig'
import type { ResolvedHomeCategory } from '../lib/homeCategoryConfig'
import { buildNowSummary, groupNowItems } from '../lib/nowBuckets'
import { parseItemDisplay } from '../lib/itemNote'
import { useLingeringChecked } from '../hooks/useLingeringChecked'
import { useUndoAction } from '../hooks/useUndoAction'
import { NowSection } from './NowSection'
import { AddBar } from './AddBar'
import { ItemEditSheet } from './ItemEditSheet'
import { SkeletonList } from './SkeletonList'
import { UndoToast } from './UndoToast'
import { CompactTitleBar, LargeTitle } from './ScreenHeader'
import { useCompactTitle } from '../hooks/useCompactTitle'

interface HomeTabProps {
  session: Session
  showDone: boolean
  onShowDoneChange: (show: boolean) => void
  onRemoteInsert: (item: GroceryItem) => void
  active: boolean
  onOpenSettings: () => void
  onTabChange: (tab: 'home' | 'henry') => void
}

export function HomeTab({
  session,
  showDone,
  onShowDoneChange,
  onRemoteInsert,
  active,
  onOpenSettings,
  onTabChange,
}: HomeTabProps) {
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
  } = useItems(session, { section: 'home', onRemoteInsert, active })
  const compactTitle = useCompactTitle(mainRef, titleRef)
  const { lingeringIds, retain, release } = useLingeringChecked(showDone)
  const undo = useUndoAction()
  const { visibleCategories } = useCategoryConfig(session.listId, 'home')

  const [editingItem, setEditingItem] = useState<GroceryItem | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<HomeCategoryId | 'all'>(
    'all',
  )

  const buckets = useMemo(() => {
    const source = items
      .filter((item) => !undo.hiddenIds.has(item.id))
      .filter((item) =>
        categoryFilter === 'all'
          ? true
          : normalizeHomeCategoryId(item.category) === categoryFilter,
      )
      .map((item) =>
        lingeringIds.has(item.id) && item.checked
          ? { ...item, checked: false }
          : item,
      )
    const grouped = groupNowItems(source, { showDone })
    const byId = new Map(items.map((item) => [item.id, item]))
    return grouped.map((bucket) => ({
      ...bucket,
      items: bucket.items
        .map((item) => byId.get(item.id) ?? item)
        .filter((item) => !undo.hiddenIds.has(item.id)),
    }))
  }, [items, showDone, undo.hiddenIds, lingeringIds, categoryFilter])

  const checkedCount = items.filter((i) => i.checked).length
  const summary = loading ? 'Loading…' : buildNowSummary(items)

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
      category: payload.category as HomeCategoryId,
      due_at: payload.due_at,
      note: payload.note,
    })
  }

  const handleAdd = useCallback(
    async (
      text: string,
      category: HomeCategoryId,
      extras?: Parameters<typeof addItem>[2],
    ) => {
      await addItem(text, category, extras)
    },
    [addItem],
  )

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

  const typeChipFor = (item: GroceryItem) => {
    const id = normalizeHomeCategoryId(item.category)
    return {
      emoji: getHomeCategoryEmoji(id),
      label: getHomeCategoryLabel(id),
    }
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <CompactTitleBar
        activeTab="home"
        onTabChange={onTabChange}
        visible={compactTitle}
        onOpenSettings={onOpenSettings}
      />
      <main ref={mainRef} className="relative flex-1 overflow-y-auto pb-28">
        <LargeTitle
          titleRef={titleRef}
          activeTab="home"
          onTabChange={onTabChange}
          subtitle={summary}
          onOpenSettings={onOpenSettings}
        />

        <div className="mb-3 flex gap-2 overflow-x-auto px-gutter pb-1">
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={`min-h-11 shrink-0 rounded-full px-3 text-meta font-medium ${
              categoryFilter === 'all'
                ? 'bg-sage text-cream'
                : 'bg-cream-dark text-ink dark:bg-surface dark:text-ink-dark'
            }`}
          >
            All
          </button>
          {(visibleCategories as ResolvedHomeCategory[]).map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(cat.id)}
              className={`min-h-11 shrink-0 rounded-full px-3 text-meta font-medium ${
                categoryFilter === cat.id
                  ? 'bg-sage text-cream'
                  : 'bg-cream-dark text-ink dark:bg-surface dark:text-ink-dark'
              }`}
            >
              <span aria-hidden="true">{cat.emoji}</span> {cat.label}
            </button>
          ))}
        </div>

        {error && (
          <p className="mx-gutter mb-3 rounded-[var(--radius-md)] bg-error-banner px-3 py-2 text-footnote">
            Couldn&apos;t sync — retrying
          </p>
        )}
        {loading ? (
          <SkeletonList />
        ) : items.length === 0 ? (
          <div className="px-gutter py-8">
            <p className="text-title text-ink dark:text-ink-dark">
              Nothing needs you right now
            </p>
            <p className="mt-1 text-footnote text-warm-gray dark:text-warm-gray-light">
              Tap + ADD to capture something
            </p>
          </div>
        ) : (
          <>
            {buckets.map((bucket) => (
              <NowSection
                key={bucket.id}
                id={bucket.id}
                label={bucket.label}
                items={bucket.items}
                defaultCollapsed={bucket.defaultCollapsed}
                currentUserName={session.displayName}
                onToggle={handleToggle}
                onDelete={requestDelete}
                onEdit={setEditingItem}
                typeChipFor={typeChipFor}
              />
            ))}
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
        section="home"
        listId={session.listId}
        categories={visibleCategories as ResolvedHomeCategory[]}
        items={items}
        onAdd={(text, category, extras) =>
          handleAdd(text, category as HomeCategoryId, extras)
        }
      />

      {editingItem && (
        <ItemEditSheet
          item={editingItem}
          listId={session.listId}
          categories={visibleCategories as ResolvedHomeCategory[]}
          onSave={handleSaveItem}
          onClose={() => setEditingItem(null)}
          getCategoryLabel={(id) => getHomeCategoryLabel(id as HomeCategoryId)}
          getCategoryEmoji={(id) => getHomeCategoryEmoji(id as HomeCategoryId)}
          onSaveOverride={(listId, text, cat) =>
            saveHomeOverride(listId, text, cat as HomeCategoryId)
          }
          showScheduleFields
        />
      )}
    </div>
  )
}
