import { useRef, useState, useMemo, useCallback } from 'react'
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
import { CompactTitleBar, LargeTitle } from './ScreenHeader'
import { listCountLabel, useCompactTitle } from '../hooks/useCompactTitle'

interface HomeTabProps {
  session: Session
  showDone: boolean
  onShowDoneChange: (show: boolean) => void
  onRemoteInsert: (item: GroceryItem) => void
  active: boolean
  onOpenSettings: () => void
}

export function HomeTab({
  session,
  showDone,
  onShowDoneChange,
  onRemoteInsert,
  active,
  onOpenSettings,
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
    refetch,
  } = useItems(session, { section: 'home', onRemoteInsert, active })
  const compactTitle = useCompactTitle(mainRef, titleRef)
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

  const uncheckedCount = items.filter((i) => !i.checked).length
  const checkedCount = items.filter((i) => i.checked).length
  const subtitle = listCountLabel(uncheckedCount, 'todo', 'All caught up', loading)

  const visibleSections = (visibleCategories as ResolvedHomeCategory[]).filter(
    (cat) => {
      const catItems = grouped.get(cat.id) ?? []
      if (catItems.length === 0) return false
      if (!showDone && catItems.every((i) => i.checked)) return false
      return true
    },
  )

  const handleSaveItem = async (
    id: string,
    payload: { text: string; category: string },
  ) => {
    await updateItem(id, {
      text: payload.text,
      category: payload.category as HomeCategoryId,
    })
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
    <div className="relative flex min-h-0 flex-1 flex-col">
      <CompactTitleBar
        title="Home"
        visible={compactTitle}
        onOpenSettings={onOpenSettings}
      />
      <main
        ref={mainRef}
        className="relative flex-1 overflow-y-auto pb-2"
        {...handlers}
      >
        <div
          className="pointer-events-none flex items-center justify-center overflow-hidden text-meta text-sage dark:text-sage-light"
          style={{
            height: pullDistance > 0 || isRefreshing ? 40 : 0,
            opacity: pullDistance > 0 || isRefreshing ? 1 : 0,
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

        <LargeTitle
          titleRef={titleRef}
          title="Home"
          subtitle={subtitle}
          onOpenSettings={onOpenSettings}
        />

        {error && (
          <p className="mx-gutter mb-3 rounded-[var(--radius-md)] bg-error-banner px-3 py-2 text-footnote">
            Couldn&apos;t load items. Pull down to retry.
          </p>
        )}
        {loading ? (
          <SkeletonList />
        ) : items.length === 0 ? (
          <div className="px-gutter py-8">
            <p className="text-body text-ink dark:text-ink-dark">Nothing to do</p>
            <p className="mt-1 text-footnote text-warm-gray dark:text-warm-gray-light">
              Add a task in the bar below
            </p>
          </div>
        ) : (
          <>
            {visibleSections.map((cat) => renderCategory(cat))}
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