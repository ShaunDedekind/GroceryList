import { useCallback, useEffect, useRef, useState } from 'react'
import type { CategoryId, GroceryItem, Session } from '../types'
import {
  applyOrderUpdates,
  nextSortOrder,
  sortItems,
  type ItemOrderUpdate,
} from '../lib/itemOrder'
import { supabase } from '../lib/supabase'
import { getSession } from '../lib/storage'
import { saveRecentItem } from '../lib/recentItems'
import { saveOverride } from '../lib/categoryOverrides'

async function loadItems(listId: string) {
  return supabase
    .from('items')
    .select('*')
    .eq('list_id', listId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
}

export function useItems(
  session: Session,
  options?: { onRemoteInsert?: (item: GroceryItem) => void },
) {
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

      setItems(sortItems(data ?? []))
      setError(null)
    },
    [],
  )

  const pollItems = useCallback(async () => {
    if (isDraggingRef.current) return
    const { data, error: fetchError } = await loadItems(session.listId)
    applyFetchResult(
      data as GroceryItem[] | null,
      fetchError ? new Error(fetchError.message) : null,
    )
  }, [session.listId, applyFetchResult])

  const refetch = useCallback(async () => {
    const { data, error: fetchError } = await loadItems(session.listId)
    applyFetchResult(
      data as GroceryItem[] | null,
      fetchError ? new Error(fetchError.message) : null,
    )
  }, [session.listId, applyFetchResult])

  useEffect(() => {
    let cancelled = false

    async function initialLoad() {
      const { data, error: fetchError } = await loadItems(session.listId)

      if (cancelled) return

      applyFetchResult(
        data as GroceryItem[] | null,
        fetchError ? new Error(fetchError.message) : null,
      )
      setLoading(false)
    }

    initialLoad()

    const channel = supabase
      .channel(`items:${session.listId}`)
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
            const newItem = payload.new as GroceryItem
            const currentName =
              getSession()?.displayName ?? session.displayName
            if (newItem.added_by !== currentName) {
              options?.onRemoteInsert?.(newItem)
            }
            setItems((prev) =>
              sortItems([...prev, newItem]),
            )
          } else if (payload.eventType === 'UPDATE') {
            setItems((prev) =>
              sortItems(
                prev.map((item) =>
                  item.id === payload.new.id
                    ? (payload.new as GroceryItem)
                    : item,
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
  }, [session.listId, session.displayName, applyFetchResult, pollItems, options?.onRemoteInsert])

  const setDragging = useCallback((dragging: boolean) => {
    isDraggingRef.current = dragging
  }, [])

  const addItem = useCallback(
    async (text: string, category: CategoryId) => {
      if (!text.trim()) return

      const displayName = getSession()?.displayName ?? session.displayName
      const sort_order = nextSortOrder(items, category)

      const { data, error: insertError } = await supabase
        .from('items')
        .insert({
          list_id: session.listId,
          text: text.trim(),
          category,
          added_by: displayName,
          sort_order,
        })
        .select()
        .single()

      if (insertError) throw insertError

      saveRecentItem(session.listId, text.trim(), category)
      setItems((prev) => sortItems([...prev, data as GroceryItem]))
    },
    [session.listId, session.displayName, items],
  )

  const addItems = useCallback(
    async (toAdd: { text: string; category: CategoryId }[]) => {
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
            item.id === id ? (data as GroceryItem) : item,
          ),
        ),
      )
    }
  }, [])

  const updateItem = useCallback(
    async (id: string, updates: { text?: string; category?: CategoryId }) => {
      const trimmedText = updates.text?.trim()
      const patch: { text?: string; category?: CategoryId } = {}
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
              item.id === id ? (data as GroceryItem) : item,
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
        if (moved && moved.category !== previous.find((item) => item.id === update.id)?.category) {
          saveOverride(session.listId, moved.text, update.category)
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
    [items, session.listId],
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
    const previous = items
    setItems((prev) => prev.filter((item) => !item.checked))

    const { error: deleteError } = await supabase
      .from('items')
      .delete()
      .eq('list_id', session.listId)
      .eq('checked', true)

    if (deleteError) {
      setItems(previous)
      throw deleteError
    }
  }, [session.listId, items])

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
  }
}
