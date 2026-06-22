import { useMemo, useRef, useState } from 'react'
import type { Session } from '../types'
import type { CategoryId } from '../types'
import { CATEGORIES } from '../constants/categories'
import { useItems } from '../hooks/useItems'
import { usePullToRefresh } from '../hooks/usePullToRefresh'
import { updateListName as updateListNameRemote } from '../lib/supabase'
import { CategorySection } from './CategorySection'
import { AddItemBar } from './AddItemBar'
import { ShareSheet } from './ShareSheet'
import { PasteSheet } from './PasteSheet'
import { SkeletonList } from './SkeletonList'

interface ListViewProps {
  session: Session
  onLeave: () => void
  onUpdateListName: (name: string) => void
}

export function ListView({ session, onLeave, onUpdateListName }: ListViewProps) {
  const { items, loading, error, addItem, addItems, toggleItem, deleteItem, clearChecked, refetch } =
    useItems(session)
  const mainRef = useRef<HTMLElement>(null)
  const [showShare, setShowShare] = useState(false)
  const [showPaste, setShowPaste] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showDone, setShowDone] = useState(false)
  const [editName, setEditName] = useState(session.listName)

  const { pullDistance, isRefreshing, handlers } = usePullToRefresh(mainRef, {
    onRefresh: refetch,
    enabled: !loading,
  })

  const grouped = useMemo(() => {
    const map = new Map<CategoryId, typeof items>()
    for (const cat of CATEGORIES) {
      map.set(cat.id, [])
    }
    for (const item of items) {
      const list = map.get(item.category as CategoryId) ?? map.get('other')!
      list.push(item)
    }
    return map
  }, [items])

  const uncheckedCount = items.filter((i) => !i.checked).length
  const checkedCount = items.filter((i) => i.checked).length

  const visibleCategories = CATEGORIES.filter((cat) => {
    const catItems = grouped.get(cat.id) ?? []
    if (catItems.length === 0) return false
    if (!showDone && catItems.every((i) => i.checked)) return false
    return true
  })

  const handleSaveName = async () => {
    const name = editName.trim() || 'Our Grocery List'
    try {
      await updateListNameRemote(session.listId, name)
      onUpdateListName(name)
    } catch {
      onUpdateListName(name)
    }
    setShowSettings(false)
  }

  return (
    <div className="flex min-h-dvh flex-col bg-cream dark:bg-[#141c27]">
      <header className="safe-top sticky top-0 z-10 border-b border-cream-dark/80 bg-cream/90 px-4 pb-3 pt-3 backdrop-blur-lg dark:border-[#2d3f54]/80 dark:bg-[#141c27]/90">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-bold text-[#1e293b] dark:text-[#e2e8f0]">
              {session.listName}
            </h1>
            <p className="text-sm text-warm-gray dark:text-warm-gray-light">
              {uncheckedCount === 0
                ? 'All done!'
                : `${uncheckedCount} item${uncheckedCount === 1 ? '' : 's'} left`}
              {' · '}
              {session.displayName}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowPaste(true)}
              className="press-scale flex h-11 w-11 items-center justify-center rounded-full text-sage active:bg-sage/10"
              aria-label="Paste items"
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="7" y="4" width="12" height="14" rx="2" />
                <path d="M5 7H4a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-1" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setShowShare(true)}
              className="press-scale flex h-11 w-11 items-center justify-center rounded-full text-sage active:bg-sage/10"
              aria-label="Share list code"
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="16" cy="5" r="2.5" />
                <circle cx="6" cy="11" r="2.5" />
                <circle cx="16" cy="17" r="2.5" />
                <path d="M8.2 9.7l5.6-3.2M8.2 12.3l5.6 3.2" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => {
                setEditName(session.listName)
                setShowSettings(true)
              }}
              className="press-scale flex h-11 w-11 items-center justify-center rounded-full text-warm-gray active:bg-cream-dark dark:active:bg-[#1e2a3a]"
              aria-label="Settings"
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="11" cy="11" r="3" />
                <path d="M11 2v2M11 18v2M2 11h2M18 11h2M4.9 4.9l1.4 1.4M15.7 15.7l1.4 1.4M4.9 17.1l1.4-1.4M15.7 6.3l1.4-1.4" />
              </svg>
            </button>
          </div>
        </div>

        {checkedCount > 0 && (
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowDone(!showDone)}
              className="text-sm font-medium text-sage active:text-sage-dark"
            >
              {showDone ? 'Hide done' : `Show done (${checkedCount})`}
            </button>
            {showDone && (
              <button
                type="button"
                onClick={clearChecked}
                className="text-sm text-warm-gray-light active:text-red-500"
              >
                Clear done
              </button>
            )}
          </div>
        )}
      </header>

      <main
        ref={mainRef}
        className="relative flex-1 overflow-y-auto px-3 pt-2 pb-4"
        {...handlers}
      >
        <div
          className="pointer-events-none flex items-center justify-center overflow-hidden text-sm text-sage transition-[height] dark:text-sage-light"
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
          <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
            Could not load items: {error}
          </p>
        )}
        {loading ? (
          <SkeletonList />
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl">🥑</span>
            <p className="mt-4 text-lg font-medium text-[#1e293b] dark:text-[#e2e8f0]">
              Your list is empty
            </p>
            <p className="mt-1 text-sm text-warm-gray dark:text-warm-gray-light">
              Add something below to get started
            </p>
          </div>
        ) : (
          visibleCategories.map((cat) => {
            const catItems = grouped.get(cat.id) ?? []
            const filtered = showDone
              ? catItems
              : catItems.filter((i) => !i.checked)
            return (
              <CategorySection
                key={cat.id}
                categoryId={cat.id}
                items={filtered}
                currentUserName={session.displayName}
                onToggle={toggleItem}
                onDelete={deleteItem}
              />
            )
          })
        )}
      </main>

      <AddItemBar listId={session.listId} onAdd={addItem} />

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

      {showSettings && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          onClick={() => setShowSettings(false)}
        >
          <div
            className="safe-bottom w-full max-w-lg rounded-t-3xl bg-white px-6 pb-8 pt-6 dark:bg-[#1e2a3a]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-cream-dark dark:bg-[#2d3f54]" />
            <h3 className="text-lg font-semibold text-[#1e293b] dark:text-[#e2e8f0]">
              Settings
            </h3>

            <label className="mt-5 block">
              <span className="text-sm font-medium text-warm-gray dark:text-warm-gray-light">
                List name
              </span>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="mt-2 w-full rounded-xl border border-cream-dark bg-cream/50 px-4 py-3 text-base outline-none focus:border-sage dark:border-[#2d3f54] dark:bg-[#141c27] dark:text-[#e2e8f0]"
              />
            </label>

            <button
              type="button"
              onClick={handleSaveName}
              className="press-scale mt-4 w-full rounded-2xl bg-sage py-3.5 font-semibold text-white active:bg-sage-dark"
            >
              Save
            </button>

            <button
              type="button"
              onClick={() => {
                setShowSettings(false)
                onLeave()
              }}
              className="mt-3 w-full rounded-2xl py-3.5 font-medium text-red-500 active:bg-red-50 dark:active:bg-red-950/20"
            >
              Leave List
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
