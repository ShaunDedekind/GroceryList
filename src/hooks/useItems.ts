import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  CategoryId,
  GroceryItem,
  HomeCategoryId,
  ItemCategoryId,
  ListSection,
  Session,
} from '../types'
import {
  applyOrderUpdates,
  nextSortOrder,
  sortItems,
  type ItemOrderUpdate,
} from '../lib/itemOrder'
import { supabase } from '../lib/supabase'
import { getSession } from '../lib/storage'
import { saveRecentHomeItem, saveRecentItem } from '../lib/recentItems'
import { saveOverride } from '../lib/categoryOverrides'
import { saveHomeOverride } from '../lib/homeCategoryOverrides'
import { normalizeItemSection, shouldDeleteOnClearChecked } from '../lib/sectionItems'

async function loadItems(listId: string, section: ListSection) {
  return supabase
    .from('items')
    .select('*')
    .eq('list_id', listId)
    .eq('section', section)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
}

function normalizeItem(raw: GroceryItem): GroceryItem {
  return {
    ...raw,
    section: normalizeItemSection(raw.section),
  }
}

export interface UseItemsOptions {
  section: ListSection
  onRemoteInsert?: (item: GroceryItem) => void
}

export function useItems(session: Session, options: UseItemsOptions) {
  const { section, onRemoteInsert } = options
  const [items, setItems] = useState<GroceryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isDraggingRef = useRef(false)

  const applyFetchResult = useCallback(
    (data: GroceryItem[] | null, fetchError: Error | null) => {
      if (fetchError) {
        console.error('Failed to fetch items:', fetchError.message)
        setError(fetchError.message)
        return
      }

      if (isDraggingRef.current) return

      setItems(sortItems((data ?? []).map(normalizeItem)))
      setError(null)
    },
    [],
  )

  const pollItems = useCallback(async () => {
    if (isDraggingRef.current) return
    const { data, error: fetchError } = await loadItems(session.listId, section)
    applyFetchResult(
      data as GroceryItem[] | null,
      fetchError ? new Error(fetchError.message) : null,
    )
  }, [session.listId, section, applyFetchResult])

  const refetch = useCallback(async () => {
    const { data, error: fetchError } = await loadItems(session.listId, section)
    applyFetchResult(
      data as GroceryItem[] | null,
      fetchError ? new Error(fetchError.message) : null,
    )
  }, [session.listId, section, applyFetchResult])

  useEffect(() => {
    let cancelled = false

    async function initialLoad() {
      const { data, error: fetchError } = await loadItems(session.listId, section)

      if (cancelled) return

      applyFetchResult(
        data as GroceryItem[] | null,
        fetchError ? new Error(fetchError.message) : null,
      )
      setLoading(false)
    }

    initialLoad()

    const channel = supabase
      .channel(`items:${section}:${session.listId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'items',
          filter: `list_id=eq.${session.listId}`,
        },
        (payload) => {
          if (isDraggingRef.current) return

          if (payload.eventType === 'INSERT') {
            const newItem = normalizeItem(payload.new as GroceryItem)
            if (newItem.section !== section) return

            const currentName =
              getSession()?.displayName ?? session.displayName
            if (newItem.added_by !== currentName) {
              onRemoteInsert?.(newItem)
            }
            setItems((prev) => sortItems([...prev, newItem]))
          } else if (payload.eventType === 'UPDATE') {
            const updated = normalizeItem(payload.new as GroceryItem)
            if (updated.section !== section) {
              setItems((prev) => prev.filter((item) => item.id !== updated.id))
              return
            }
            setItems((prev) =>
              sortItems(
                prev.map((item) =>
                  item.id === updated.id ? updated : item,
                ),
              ),
            )
          } else if (payload.eventType === 'DELETE') {
            setItems((prev) =>
              prev.filter((item) => item.id !== payload.old.id),
            )
          }
        },
      )
      .subscribe()

    const pollInterval = setInterval(pollItems, 3000)

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
      clearInterval(pollInterval)
    }
  }, [
    session.listId,
    session.displayName,
    section,
    applyFetchResult,
    pollItems,
    onRemoteInsert,
  ])

  const setDragging = useCallback((dragging: boolean) => {
    isDraggingRef.current = dragging
  }, [])

  const addItem = useCallback(
    async (text: string, category: ItemCategoryId) => {
      if (!text.trim()) return

      const displayName = getSession()?.displayName ?? session.displayName
      const sort_order = nextSortOrder(items, category)

      const { data, error: insertError } = await supabase
        .from('items')
        .insert({
          list_id: session.listId,
          section,
          text: text.trim(),
          category,
          added_by: displayName,
          sort_order,
        })
        .select()
        .single()

      if (insertError) throw insertError

      if (section === 'home') {
        saveRecentHomeItem(session.listId, text.trim(), category as HomeCategoryId)
      } else {
        saveRecentItem(session.listId, text.trim(), category as CategoryId)
      }
      setItems((prev) => sortItems([...prev, normalizeItem(data as GroceryItem)]))
    },
    [session.listId, session.displayName, items, section],
  )

  const addItems = useCallback(
    async (toAdd: { text: string; category: ItemCategoryId }[]) => {
      let added = 0
      for (const item of toAdd) {
        if (!item.text.trim()) continue
        await addItem(item.text, item.category)
        added++
      }
      return added
    },
    [addItem],
  )

  const toggleItem = useCallback(async (id: string, checked: boolean) => {
    setItems((prev) =>
      sortItems(
        prev.map((item) => (item.id === id ? { ...item, checked } : item)),
      ),
    )

    const { data, error: updateError } = await supabase
      .from('items')
      .update({ checked })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      setItems((prev) =>
        sortItems(
          prev.map((item) =>
            item.id === id ? { ...item, checked: !checked } : item,
          ),
        ),
      )
      throw updateError
    }

    if (data) {
      setItems((prev) =>
        sortItems(
          prev.map((item) =>
            item.id === id ? normalizeItem(data as GroceryItem) : item,
          ),
        ),
      )
    }
  }, [])

  const updateItem = useCallback(
    async (
      id: string,
      updates: { text?: string; category?: ItemCategoryId },
    ) => {
      const trimmedText = updates.text?.trim()
      const patch: { text?: string; category?: ItemCategoryId } = {}
      if (trimmedText) patch.text = trimmedText
      if (updates.category) patch.category = updates.category
      if (Object.keys(patch).length === 0) return

      const previous = items
      setItems((prev) =>
        sortItems(
          prev.map((item) =>
            item.id === id ? { ...item, ...patch } : item,
          ),
        ),
      )

      const { data, error: updateError } = await supabase
        .from('items')
        .update(patch)
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        setItems(previous)
        throw updateError
      }

      if (data) {
        setItems((prev) =>
          sortItems(
            prev.map((item) =>
              item.id === id ? normalizeItem(data as GroceryItem) : item,
            ),
          ),
        )
      }
    },
    [items],
  )

  const reorderItems = useCallback(
    async (updates: ItemOrderUpdate[]) => {
      if (updates.length === 0) return

      const previous = items
      const nextItems = applyOrderUpdates(items, updates)
      setItems(nextItems)

      for (const update of updates) {
        const moved = nextItems.find((item) => item.id === update.id)
        if (
          moved &&
          moved.category !== previous.find((item) => item.id === update.id)?.category
        ) {
          if (section === 'home') {
            saveHomeOverride(
              session.listId,
              moved.text,
              update.category as HomeCategoryId,
            )
          } else {
            saveOverride(session.listId, moved.text, update.category as CategoryId)
          }
        }
      }

      try {
        const results = await Promise.all(
          updates.map((update) =>
            supabase
              .from('items')
              .update({
                category: update.category,
                sort_order: update.sort_order,
              })
              .eq('id', update.id),
          ),
        )

        for (const result of results) {
          if (result.error) throw result.error
        }
      } catch (err) {
        setItems(previous)
        throw err
      }
    },
    [items, session.listId, section],
  )

  const deleteItem = useCallback(async (id: string) => {
    const previous = items
    setItems((prev) => prev.filter((item) => item.id !== id))

    const { error: deleteError } = await supabase
      .from('items')
      .delete()
      .eq('id', id)

    if (deleteError) {
      setItems(previous)
      throw deleteError
    }
  }, [items])

  const clearChecked = useCallback(async () => {
    if (!shouldDeleteOnClearChecked(section)) return

    const previous = items
    setItems((prev) => prev.filter((item) => !item.checked))

    const { error: deleteError } = await supabase
      .from('items')
      .delete()
      .eq('list_id', session.listId)
      .eq('section', section)
      .eq('checked', true)

    if (deleteError) {
      setItems(previous)
      throw deleteError
    }
  }, [session.listId, section, items])

  return {
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
    section,
  }
}
