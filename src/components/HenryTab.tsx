import { useState, useMemo, useCallback } from 'react'
import type { Session, GroceryItem, HenryCategoryId } from '../types'
import {
  getHenryCategoryEmoji,
  getHenryCategoryLabel,
  isHenryCategoryId,
} from '../constants/henryCategories'
import { useItems } from '../hooks/useItems'
import { useCategoryConfig } from '../hooks/useCategoryConfig'
import type { ResolvedHenryCategory } from '../lib/henryCategoryConfig'
import { usePullToRefresh } from '../hooks/usePullToRefresh'
import { formatDueLabel, groupHenryItems } from '../lib/henryBuckets'
import { inboundEmailAddress } from '../lib/sectionItems'
import { supabase } from '../lib/supabase'
import { ItemRow } from './ItemRow'
import { HenryAddItemBar } from './HenryAddItemBar'
import { ItemEditSheet } from './ItemEditSheet'
import { SkeletonList } from './SkeletonList'
import { Icon } from './Icon'

interface HenryTabProps {
  session: Session
  showDone: boolean
  onShowDoneChange: (show: boolean) => void
  onRemoteInsert: (item: GroceryItem) => void
  mainRef: React.RefObject<HTMLElement | null>
  onScroll?: () => void
}

export function HenryTab({
  session,
  showDone,
  onShowDoneChange,
  onRemoteInsert,
  mainRef,
  onScroll,
}: HenryTabProps) {
  const {
    items,
    loading,
    error,
    addItem,
    toggleItem,
    updateItem,
    deleteItem,
    refetch,
  } = useItems(session, { section: 'henry', onRemoteInsert })
  const { visibleCategories } = useCategoryConfig(session.listId, 'henry')

  const [editingItem, setEditingItem] = useState<GroceryItem | null>(null)
  const [integrationsMessage, setIntegrationsMessage] = useState<string | null>(
    null,
  )
  const [showIntegrations, setShowIntegrations] = useState(false)

  const { pullDistance, isRefreshing, handlers } = usePullToRefresh(mainRef, {
    onRefresh: refetch,
    enabled: !loading,
  })

  const buckets = useMemo(
    () => groupHenryItems(items, { showDone }),
    [items, showDone],
  )
  const checkedCount = items.filter((i) => i.checked).length
  const inboundAddress = inboundEmailAddress(session.listCode)

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

  const handleConnectCalendar = async () => {
    setIntegrationsMessage(null)
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'google-calendar-oauth',
        { body: { list_id: session.listId } },
      )
      if (fnError) throw fnError
      const status = (data as { status?: string } | null)?.status
      setIntegrationsMessage(
        status === 'not_configured'
          ? 'Google Calendar coming soon'
          : 'Connected',
      )
    } catch {
      setIntegrationsMessage('Google Calendar coming soon')
    }
  }

  const typeChipFor = (item: GroceryItem) => {
    const id = isHenryCategoryId(item.category) ? item.category : 'other'
    return {
      emoji: getHenryCategoryEmoji(id),
      label: getHenryCategoryLabel(id),
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between gap-2 px-gutter pb-1 pt-1">
        <p className="text-meta text-warm-gray dark:text-warm-gray-light">
          Tasks for Henry
        </p>
        <button
          type="button"
          onClick={() => setShowIntegrations((open) => !open)}
          className="text-meta font-medium text-sage"
        >
          {showIntegrations ? 'Hide' : 'Email & calendar'}
        </button>
      </div>

      {showIntegrations && (
        <div className="px-gutter">
          <div className="mb-2 rounded-[var(--radius-md)] border border-line bg-cream-dark/40 px-3 py-2.5 dark:bg-surface-raised">
            <p className="text-meta font-semibold text-ink dark:text-ink-dark">
              Forward docs here
            </p>
            <p className="mt-1 break-all text-footnote text-warm-gray dark:text-warm-gray-light">
              {inboundAddress}
            </p>
            <p className="mt-1 text-meta text-warm-gray-light">
              Inbound parsing is scaffolded — DNS and provider wiring come next.
            </p>
            <button
              type="button"
              onClick={handleConnectCalendar}
              className="press-scale mt-2 min-h-11 rounded-full border border-line px-3 text-meta font-semibold text-ink dark:text-ink-dark"
            >
              Connect Google Calendar
            </button>
            {integrationsMessage && (
              <p className="mt-1 text-meta text-sage">{integrationsMessage}</p>
            )}
          </div>
        </div>
      )}

      <main
        ref={mainRef}
        className="relative flex-1 overflow-y-auto px-gutter pt-1 pb-2"
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
          <p className="mb-2 rounded-[var(--radius-md)] bg-error-banner px-3 py-2 text-footnote">
            Couldn&apos;t load tasks. Pull down to retry.
          </p>
        )}

        {loading ? (
          <SkeletonList />
        ) : items.length === 0 ? (
          <div className="relative py-12">
            <Icon
              name="henry"
              size="lg"
              className="absolute right-0 top-0 opacity-[0.06] dark:opacity-[0.08]"
            />
            <p className="text-large-title font-semibold text-ink dark:text-ink-dark">
              Nothing for Henry yet
            </p>
            <p className="mt-2 text-body text-warm-gray dark:text-warm-gray-light">
              Add appointments, health tasks, or admin to-dos below
            </p>
          </div>
        ) : (
          <>
            {buckets.map((bucket) => (
              <section key={bucket.id} className="mb-1">
                <h2 className="px-1 py-1 text-meta font-semibold uppercase tracking-wide text-warm-gray dark:text-warm-gray-light">
                  {bucket.label}
                  <span className="font-medium text-warm-gray-light">
                    {' '}
                    · {bucket.items.filter((i) => !i.checked).length || bucket.items.length}
                  </span>
                </h2>
                {bucket.items.map((item, index) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    currentUserName={session.displayName}
                    onToggle={toggleItem}
                    onDelete={deleteItem}
                    onEdit={setEditingItem}
                    showSeparator={index < bucket.items.length - 1}
                    dueLabel={formatDueLabel(item.due_at)}
                    typeChip={typeChipFor(item)}
                  />
                ))}
              </section>
            ))}

            {checkedCount > 0 && (
              <div className="mt-4 flex items-center gap-3 border-t border-separator pt-3 pb-2">
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

      <HenryAddItemBar
        categories={visibleCategories as ResolvedHenryCategory[]}
        onAdd={handleAdd}
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
