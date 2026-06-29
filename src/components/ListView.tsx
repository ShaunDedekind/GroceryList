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
import type { Session } from '../types'
import type { CategoryId } from '../types'
import type { GroceryItem } from '../types'
import { CATEGORIES } from '../constants/categories'
import { useItems } from '../hooks/useItems'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import { usePullToRefresh } from '../hooks/usePullToRefresh'
import { updateListName as updateListNameRemote } from '../lib/supabase'
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
import { PartnerToast } from './PartnerToast'

interface ListViewProps {
  session: Session
  onLeave: () => void
  onUpdateListName: (name: string) => void
  onUpdateDisplayName: (name: string) => void
  onCheckForUpdate: () => void
  updateAvailable: boolean
}

export function ListView({
  session,
  onLeave,
  onUpdateListName,
  onUpdateDisplayName,
  onCheckForUpdate,
  updateAvailable,
}: ListViewProps) {
  const [partnerToast, setPartnerToast] = useState<{
    name: string
    text: string
  } | null>(null)

  const handleRemoteInsert = useCallback((item: GroceryItem) => {
    setPartnerToast({ name: item.added_by ?? 'Someone', text: item.text })
  }, [])

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
    categoryIds,
  } = useItems(session, { onRemoteInsert: handleRemoteInsert })
  const mainRef = useRef<HTMLElement>(null)
  const [showShare, setShowShare] = useState(false)
  const [showPaste, setShowPaste] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showDone, setShowDone] = useState(false)
  const [editName, setEditName] = useState(session.listName)
  const [editDisplayName, setEditDisplayName] = useState(session.displayName)
  const [updateMessage, setUpdateMessage] = useState<string | null>(null)
  const updateAvailableRef = useRef(updateAvailable)
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

  useBodyScrollLock(showSettings)

  useEffect(() => {
    updateAvailableRef.current = updateAvailable
  }, [updateAvailable])

  const handleCheckForUpdate = () => {
    setUpdateMessage(null)
    onCheckForUpdate()
    window.setTimeout(() => {
      if (updateAvailableRef.current) {
        setUpdateMessage('Update available — tap Refresh above')
      } else {
        setUpdateMessage("You're on the latest version")
      }
    }, 1500)
  }

  const openSettings = () => {
    setEditName(session.listName)
    setEditDisplayName(session.displayName)
    setUpdateMessage(null)
    setShowSettings(true)
  }

  const { pullDistance, isRefreshing, handlers } = usePullToRefresh(mainRef, {
    onRefresh: refetch,
    enabled: !loading,
  })

  const grouped = useMemo(() => {
    const map = new Map<CategoryId, GroceryItem[]>()
    for (const cat of CATEGORIES) {
      map.set(cat.id, sortItemsInCategory(items, cat.id))
    }
    return map
  }, [items])

  const uncheckedCount = items.filter((i) => !i.checked).length
  const checkedCount = items.filter((i) => i.checked).length

  const shopItems = useMemo(
    () => sortShopItems(items, categoryIds),
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

  const visibleCategories = CATEGORIES.filter((cat) => {
    const catItems = grouped.get(cat.id) ?? []
    if (catItems.length === 0) return false
    if (!showDone && catItems.every((i) => i.checked)) return false
    return true
  })

  const handleSaveSettings = async () => {
    const name = editName.trim() || 'Our Grocery List'
    const displayName = editDisplayName.trim()
    if (!displayName) return

    try {
      await updateListNameRemote(session.listId, name)
      onUpdateListName(name)
    } catch {
      onUpdateListName(name)
    }
    onUpdateDisplayName(displayName)
    setShowSettings(false)
  }

  const handleSaveItem = async (id: string, text: string, category: CategoryId) => {
    await updateItem(id, { text, category })
  }

  const handleDragCancel = useCallback(() => {
    setDragging(false)
    setActiveItem(null)
  }, [setDragging])

  const exitReorderMode = useCallback(() => {
    if (activeItem) {
      handleDragCancel()
    }
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
        categoryIds,
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

  const renderCategory = (
    cat: (typeof CATEGORIES)[number],
    forceVisible = false,
  ) => {
    const catItems = grouped.get(cat.id) ?? []
    const filtered = showDone ? catItems : catItems.filter((i) => !i.checked)

    if (filtered.length === 0 && !forceVisible) return null

    return (
      <CategorySection
        key={cat.id}
        categoryId={cat.id}
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

  const subtitle =
    uncheckedCount === 0
      ? 'All done!'
      : `${uncheckedCount} left`

  return (
    <div className="flex min-h-dvh flex-col bg-cream dark:bg-surface">
      <header className="safe-top sticky top-0 z-10 border-b border-cream-dark/80 bg-cream/90 backdrop-blur-lg dark:border-border-dark/80 dark:bg-surface/90">
        <div className="flex items-center gap-2 px-4 pb-2 pt-2">
          <div className="min-w-0 flex-1">
            <button
              type="button"
              onClick={openSettings}
              className="truncate text-left text-title font-bold text-ink active:opacity-70 dark:text-ink-dark"
            >
              {session.listName}
            </button>
            <p className="truncate text-meta text-warm-gray dark:text-warm-gray-light">
              {subtitle}
              {' · '}
              {session.displayName}
            </p>
          </div>
        </div>

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
              onClick={() => setShowDone(!showDone)}
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
      </header>

      <main
        ref={mainRef}
        className="relative flex-1 overflow-y-auto px-3 pt-1.5 pb-3"
        {...handlers}
      >
        <div
          className="pointer-events-none flex items-center justify-center overflow-hidden text-meta text-sage transition-[height] dark:text-sage-light"
          style={{ height: pullDistance > 0 || isRefreshing ? Math.max(pullDistance, isRefreshing ? 40 : 0) : 0 }}
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
            {(activeItem ? CATEGORIES : visibleCategories).map((cat) =>
              renderCategory(cat, Boolean(activeItem)),
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
        onAdd={addItem}
        onPaste={() => setShowPaste(true)}
        onShare={() => setShowShare(true)}
        onStartReorder={() => setReorderMode(true)}
        onToggleShopMode={toggleShopMode}
        reorderMode={reorderMode}
        shopMode={shopMode}
      />

      <AnimatePresence>
        {partnerToast && (
          <PartnerToast
            key={`${partnerToast.name}-${partnerToast.text}`}
            name={partnerToast.name}
            text={partnerToast.text}
            onDismiss={() => setPartnerToast(null)}
          />
        )}
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
          onSave={handleSaveItem}
          onClose={() => setEditingItem(null)}
        />
      )}

      {showSettings && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          onClick={() => setShowSettings(false)}
        >
          <div
            className="safe-bottom w-full max-w-lg rounded-t-3xl bg-white px-5 pb-6 pt-5 shadow-lg dark:bg-surface-raised"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-cream-dark dark:bg-border-dark" />
            <h3 className="text-title font-semibold text-ink dark:text-ink-dark">
              Settings
            </h3>

            <label className="mt-4 block">
              <span className="text-meta font-medium text-warm-gray dark:text-warm-gray-light">
                List name
              </span>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-cream-dark bg-cream/50 px-3 py-2.5 text-body outline-none focus:border-sage dark:border-border-dark dark:bg-surface dark:text-ink-dark"
              />
            </label>

            <label className="mt-4 block">
              <span className="text-meta font-medium text-warm-gray dark:text-warm-gray-light">
                Your name
              </span>
              <input
                type="text"
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-cream-dark bg-cream/50 px-3 py-2.5 text-body outline-none focus:border-sage dark:border-border-dark dark:bg-surface dark:text-ink-dark"
              />
            </label>

            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={!editDisplayName.trim()}
              className="press-scale mt-4 w-full rounded-2xl bg-sage py-2.5 text-sm font-semibold text-white disabled:opacity-40 active:bg-sage-dark"
            >
              Save
            </button>

            <button
              type="button"
              onClick={handleCheckForUpdate}
              className="mt-2 w-full rounded-2xl py-2.5 text-sm font-medium text-sage active:bg-sage/10 dark:active:bg-sage/20"
            >
              Check for updates
            </button>
            {updateMessage && (
              <p className="mt-1.5 text-center text-meta text-warm-gray dark:text-warm-gray-light">
                {updateMessage}
              </p>
            )}

            <button
              type="button"
              onClick={() => {
                setShowSettings(false)
                onLeave()
              }}
              className="mt-2 w-full rounded-2xl py-2.5 text-sm font-medium text-red-500 active:bg-red-50 dark:active:bg-red-950/20"
            >
              Leave List
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
