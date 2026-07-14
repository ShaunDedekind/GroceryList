import { useRef, useState, useMemo, useCallback, useEffect } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { AnimatePresence } from 'motion/react'
import type { Session, CategoryId, GroceryItem } from '../types'
import { isCategoryId } from '../constants/categories'
import { useItems } from '../hooks/useItems'
import { getCategoryEmoji, getCategoryLabel } from '../constants/categories'
import { saveOverride } from '../lib/categoryOverrides'
import type { ResolvedCategory } from '../lib/categoryConfig'
import { usePullToRefresh } from '../hooks/usePullToRefresh'
import { computeReorderPatch, sortItemsInCategory, sortShopItems } from '../lib/itemOrder'
import { getShopMode, setShopMode } from '../lib/shopMode'
import { CategorySection } from './CategorySection'
import { AddItemBar } from './AddItemBar'
import { ShareSheet } from './ShareSheet'
import { PasteSheet } from './PasteSheet'
import { ItemEditSheet } from './ItemEditSheet'
import { SkeletonList } from './SkeletonList'
import { DragOverlayItem } from './DragOverlayItem'
import { ShopFlatList } from './ShopFlatList'
import { DoneCelebration } from './DoneCelebration'

interface GroceryTabProps {
  session: Session
  showDone: boolean
  onShowDoneChange: (show: boolean) => void
  onRemoteInsert: (item: GroceryItem) => void
  mainRef: React.RefObject<HTMLElement | null>
  onScroll?: () => void
  resolved: ResolvedCategory[]
  visibleCategories: ResolvedCategory[]
  categoryIds: readonly CategoryId[]
}

export function GroceryTab({
  session,
  showDone,
  onShowDoneChange,
  onRemoteInsert,
  mainRef,
  onScroll,
  resolved,
  visibleCategories,
  categoryIds,
}: GroceryTabProps) {
  const {
    items,
    loading,
    error,
    addItem,
    addItems,
    toggleItem,
    updateItem,
    reorderItems,
    deleteItem,
    clearChecked,
    refetch,
    setDragging,
  } = useItems(session, { section: 'grocery', onRemoteInsert })

  const [showShare, setShowShare] = useState(false)
  const [showPaste, setShowPaste] = useState(false)
  const [editingItem, setEditingItem] = useState<GroceryItem | null>(null)
  const [activeItem, setActiveItem] = useState<GroceryItem | null>(null)
  const [reorderMode, setReorderMode] = useState(false)
  const [shopMode, setShopModeState] = useState(() => getShopMode(session.listId))
  const [showCelebration, setShowCelebration] = useState(false)
  const prevUncheckedRef = useRef<number | null>(null)
  const hasLoadedRef = useRef(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    }),
  )

  const { pullDistance, isRefreshing, handlers } = usePullToRefresh(mainRef, {
    onRefresh: refetch,
    enabled: !loading,
  })

  const grouped = useMemo(() => {
    const cats = resolved as ResolvedCategory[]
    const map = new Map<CategoryId, GroceryItem[]>()
    for (const cat of cats) {
      map.set(cat.id, sortItemsInCategory(items, cat.id))
    }
    for (const item of items) {
      const id = isCategoryId(item.category) ? item.category : 'other'
      if (!map.has(id)) {
        map.set(id, sortItemsInCategory(items, id))
      }
    }
    return map
  }, [items, resolved])

  const uncheckedCount = items.filter((i) => !i.checked).length
  const checkedCount = items.filter((i) => i.checked).length

  const shopItems = useMemo(
    () => sortShopItems(items, categoryIds as CategoryId[]),
    [items, categoryIds],
  )

  useEffect(() => {
    if (loading) return

    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true
      prevUncheckedRef.current = uncheckedCount
      return
    }

    const prev = prevUncheckedRef.current
    if (prev !== null && prev >= 1 && uncheckedCount === 0) {
      setShowCelebration(true)
    }
    prevUncheckedRef.current = uncheckedCount
  }, [uncheckedCount, loading])

  const visibleSections = visibleCategories.filter((cat) => {
    const catItems = grouped.get(cat.id as CategoryId) ?? []
    if (catItems.length === 0) return false
    if (!showDone && catItems.every((i) => i.checked)) return false
    return true
  })

  const dragSections = visibleCategories

  const handleSaveItem = async (id: string, text: string, category: string) => {
    await updateItem(id, { text, category: category as CategoryId })
  }

  const handleDragCancel = useCallback(() => {
    setDragging(false)
    setActiveItem(null)
  }, [setDragging])

  const exitReorderMode = useCallback(() => {
    if (activeItem) handleDragCancel()
    setReorderMode(false)
  }, [activeItem, handleDragCancel])

  const toggleShopMode = useCallback(() => {
    setShopModeState((current) => {
      const next = !current
      setShopMode(session.listId, next)
      if (next) {
        setReorderMode(false)
        setDragging(false)
        setActiveItem(null)
      }
      return next
    })
  }, [session.listId, setDragging])

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      if (!reorderMode) return
      setDragging(true)
      const item = items.find((entry) => entry.id === event.active.id) ?? null
      setActiveItem(item)
    },
    [items, reorderMode, setDragging],
  )

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setDragging(false)
      setActiveItem(null)

      if (!reorderMode) return

      const { active, over } = event
      if (!over) return

      const patch = computeReorderPatch(
        String(active.id),
        String(over.id),
        items,
        categoryIds as CategoryId[],
      )

      if (patch) {
        try {
          await reorderItems(patch)
        } catch (err) {
          console.error('Failed to reorder items:', err)
        }
      }
    },
    [items, categoryIds, reorderItems, reorderMode],
  )

  const renderCategory = (cat: ResolvedCategory, forceVisible = false) => {
    const catItems = grouped.get(cat.id) ?? []
    const filtered = showDone ? catItems : catItems.filter((i) => !i.checked)

    if (filtered.length === 0 && !forceVisible) return null

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
        isDragActive={Boolean(activeItem)}
        forceVisible={forceVisible}
        reorderMode={reorderMode}
      />
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {shopMode && (
        <div className="flex items-center border-t border-sage/20 bg-sage/10 px-4 py-1.5 dark:border-sage/30 dark:bg-sage/5">
          <p className="text-meta font-medium text-sage dark:text-sage-light">
            Shop mode
          </p>
        </div>
      )}

      {reorderMode && (
        <div className="flex items-center justify-between gap-3 border-t border-sage/20 bg-sage/10 px-4 py-2 dark:border-sage/30 dark:bg-sage/5">
          <p className="text-meta text-ink dark:text-ink-dark">
            Drag items to reorder
          </p>
          <button
            type="button"
            onClick={exitReorderMode}
            className="shrink-0 rounded-full bg-sage px-3 py-1 text-meta font-semibold text-white active:bg-sage-dark"
          >
            Done
          </button>
        </div>
      )}

      {checkedCount > 0 && (
        <div className="flex items-center gap-3 px-4 pb-2">
          <button
            type="button"
            onClick={() => onShowDoneChange(!showDone)}
            className="text-meta font-medium text-sage active:text-sage-dark"
          >
            {showDone ? 'Hide done' : `Show done (${checkedCount})`}
          </button>
          {showDone && (
            <button
              type="button"
              onClick={clearChecked}
              className="text-meta text-warm-gray-light active:text-red-500"
            >
              Clear done
            </button>
          )}
        </div>
      )}

      <main
        ref={mainRef}
        className="relative flex-1 overflow-y-auto px-3 pt-1.5 pb-3"
        onScroll={onScroll}
        {...handlers}
      >
        <div
          className="pointer-events-none flex h-10 origin-top items-center justify-center overflow-hidden text-meta text-sage transition-[transform,opacity] duration-150 dark:text-sage-light"
          style={{
            transform: `scaleY(${
              pullDistance > 0 || isRefreshing
                ? Math.min(
                    Math.max(pullDistance, isRefreshing ? 40 : 0) / 40,
                    1.5,
                  )
                : 0
            })`,
            opacity: pullDistance > 0 || isRefreshing ? 1 : 0,
            willChange:
              pullDistance > 0 || isRefreshing ? 'transform' : undefined,
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
            <span className="text-5xl">🥑</span>
            <p className="mt-3 text-title font-medium text-ink dark:text-ink-dark">
              Nothing on the list yet
            </p>
            <p className="mt-1 text-meta text-warm-gray dark:text-warm-gray-light">
              Add something below, or paste a recipe from ⋯
            </p>
          </div>
        ) : shopMode ? (
          <ShopFlatList
            items={shopItems}
            currentUserName={session.displayName}
            onToggle={toggleItem}
            onDelete={deleteItem}
            onEdit={setEditingItem}
          />
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            {(activeItem ? dragSections : visibleSections).map((cat) =>
              renderCategory(cat as ResolvedCategory, Boolean(activeItem)),
            )}
            <DragOverlay>
              {activeItem ? (
                <DragOverlayItem
                  item={activeItem}
                  currentUserName={session.displayName}
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </main>

      <AddItemBar
        listId={session.listId}
        categories={visibleCategories as ResolvedCategory[]}
        onAdd={addItem}
        onPaste={() => setShowPaste(true)}
        onShare={() => setShowShare(true)}
        onStartReorder={() => setReorderMode(true)}
        onToggleShopMode={toggleShopMode}
        reorderMode={reorderMode}
        shopMode={shopMode}
      />

      <AnimatePresence>
        {showCelebration && (
          <DoneCelebration onComplete={() => setShowCelebration(false)} />
        )}
      </AnimatePresence>

      {showShare && (
        <ShareSheet code={session.listCode} onClose={() => setShowShare(false)} />
      )}

      {showPaste && (
        <PasteSheet
          listId={session.listId}
          onAddItems={addItems}
          onClose={() => setShowPaste(false)}
        />

      )}

      {editingItem && (
        <ItemEditSheet
          item={editingItem}
          listId={session.listId}
          categories={visibleCategories as ResolvedCategory[]}
          onSave={handleSaveItem}
          onClose={() => setEditingItem(null)}
          getCategoryLabel={(id) => getCategoryLabel(id as CategoryId)}
          getCategoryEmoji={(id) => getCategoryEmoji(id as CategoryId)}
          onSaveOverride={(listId, text, cat) =>
            saveOverride(listId, text, cat as CategoryId)
          }
        />
      )}
    </div>
  )
}