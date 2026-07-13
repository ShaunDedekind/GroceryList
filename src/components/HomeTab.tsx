import { useState, useMemo, useCallback } from 'react'
import type { Session, GroceryItem, HomeCategoryId } from '../types'
import {
  getHomeCategoryEmoji,
  getHomeCategoryLabel,
  isHomeCategoryId,
} from '../constants/homeCategories'
import { saveHomeOverride } from '../lib/homeCategoryOverrides'
import { useItems } from '../hooks/useItems'
import { useCategoryConfig } from '../hooks/useCategoryConfig'
import type { ResolvedHomeCategory } from '../lib/homeCategoryConfig'
import { usePullToRefresh } from '../hooks/usePullToRefresh'
import { sortItemsInCategory } from '../lib/itemOrder'
import { CategorySection } from './CategorySection'
import { HomeAddItemBar } from './HomeAddItemBar'
import { ItemEditSheet } from './ItemEditSheet'
import { SkeletonList } from './SkeletonList'

interface HomeTabProps {
  session: Session
  showDone: boolean
  onShowDoneChange: (show: boolean) => void
  onRemoteInsert: (item: GroceryItem) => void
  mainRef: React.RefObject<HTMLElement | null>
  onScroll?: () => void
}

export function HomeTab({
  session,
  showDone,
  onShowDoneChange,
  onRemoteInsert,
  mainRef,
  onScroll,
}: HomeTabProps) {
  const {
    items,
    loading,
    error,
    addItem,
    toggleItem,
    updateItem,
    deleteItem,
    refetch,
  } = useItems(session, { section: 'home', onRemoteInsert })
  const { visibleCategories } = useCategoryConfig(session.listId, 'home')

  const [editingItem, setEditingItem] = useState<GroceryItem | null>(null)

  const { pullDistance, isRefreshing, handlers } = usePullToRefresh(mainRef, {
    onRefresh: refetch,
    enabled: !loading,
  })

  const grouped = useMemo(() => {
    const map = new Map<HomeCategoryId, GroceryItem[]>()
    for (const cat of visibleCategories as ResolvedHomeCategory[]) {
      map.set(cat.id, sortItemsInCategory(items, cat.id))
    }
    for (const item of items) {
      const id = isHomeCategoryId(item.category) ? item.category : 'other'
      if (!map.has(id)) {
        map.set(id, sortItemsInCategory(items, id))
      }
    }
    return map
  }, [items, visibleCategories])

  const checkedCount = items.filter((i) => i.checked).length

  const visibleSections = (visibleCategories as ResolvedHomeCategory[]).filter(
    (cat) => {
      const catItems = grouped.get(cat.id) ?? []
      if (catItems.length === 0) return false
      if (!showDone && catItems.every((i) => i.checked)) return false
      return true
    },
  )

  const handleSaveItem = async (id: string, text: string, category: string) => {
    await updateItem(id, { text, category: category as HomeCategoryId })
  }

  const handleAdd = useCallback(
    async (text: string, category: HomeCategoryId) => {
      await addItem(text, category)
    },
    [addItem],
  )

  const renderCategory = (cat: ResolvedHomeCategory) => {
    const catItems = grouped.get(cat.id) ?? []
    const filtered = showDone ? catItems : catItems.filter((i) => !i.checked)

    if (filtered.length === 0) return null

    return (
      <CategorySection
        key={cat.id}
        categoryId={cat.id}
        categoryLabel={cat.label}
        categoryEmoji={cat.emoji}
        items={filtered}
        currentUserName={session.displayName}
        onToggle={toggleItem}
        onDelete={deleteItem}
        onEdit={setEditingItem}
        reorderMode={false}
      />
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {checkedCount > 0 && (
        <div className="flex items-center gap-3 px-4 pb-2">
          <button
            type="button"
            onClick={() => onShowDoneChange(!showDone)}
            className="text-meta font-medium text-sage active:text-sage-dark"
          >
            {showDone ? 'Hide done' : `Show done (${checkedCount})`}
          </button>
        </div>
      )}

      <main
        ref={mainRef}
        className="relative flex-1 overflow-y-auto px-3 pt-1.5 pb-3"
        onScroll={onScroll}
        {...handlers}
      >
        <div
          className="pointer-events-none flex items-center justify-center overflow-hidden text-meta text-sage transition-[height] dark:text-sage-light"
          style={{
            height:
              pullDistance > 0 || isRefreshing
                ? Math.max(pullDistance, isRefreshing ? 40 : 0)
                : 0,
          }}
          aria-hidden="true"
        >
          {isRefreshing ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-sage/30 border-t-sage" />
          ) : pullDistance >= 72 ? (
            'Release to refresh'
          ) : pullDistance > 0 ? (
            'Pull to refresh'
          ) : null}
        </div>

        {error && (
          <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-meta text-red-600 dark:bg-red-950/30 dark:text-red-400">
            Could not load items: {error}
          </p>
        )}
        {loading ? (
          <SkeletonList />
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-5xl">🏠</span>
            <p className="mt-3 text-title font-medium text-ink dark:text-ink-dark">
              Nothing on the home list yet
            </p>
            <p className="mt-1 text-meta text-warm-gray dark:text-warm-gray-light">
              Things to fix, buy, or remember at home
            </p>
          </div>
        ) : (
          visibleSections.map((cat) => renderCategory(cat))
        )}
      </main>

      <HomeAddItemBar
        listId={session.listId}
        categories={visibleCategories as ResolvedHomeCategory[]}
        onAdd={handleAdd}
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
        />
      )}
    </div>
  )
}