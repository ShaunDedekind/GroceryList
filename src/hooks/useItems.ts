import { useCallback, useEffect, useState } from 'react'
import type { CategoryId, GroceryItem, Session } from '../types'
import { supabase } from '../lib/supabase'
import { getSession } from '../lib/storage'
import { saveRecentItem } from '../lib/recentItems'

function sortItems(items: GroceryItem[]): GroceryItem[] {
  return [...items].sort((a, b) => {
    if (a.checked !== b.checked) return a.checked ? 1 : -1
    return a.text.localeCompare(b.text)
  })
}

async function loadItems(listId: string) {
  return supabase
    .from('items')
    .select('*')
    .eq('list_id', listId)
    .order('created_at', { ascending: true })
}

export function useItems(session: Session) {
  const [items, setItems] = useState<GroceryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const applyFetchResult = useCallback(
    (data: GroceryItem[] | null, fetchError: Error | null) => {
      if (fetchError) {
        console.error('Failed to fetch items:', fetchError.message)
        setError(fetchError.message)
      } else {
        setItems(sortItems(data ?? []))
        setError(null)
      }
    },
    [],
  )

  const pollItems = useCallback(async () => {
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
          if (payload.eventType === 'INSERT') {
            setItems((prev) =>
              sortItems([...prev, payload.new as GroceryItem]),
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
  }, [session.listId, applyFetchResult, pollItems])

  const addItem = useCallback(
    async (text: string, category: CategoryId) => {
      if (!text.trim()) return

      const displayName = getSession()?.displayName ?? session.displayName

      const { data, error: insertError } = await supabase
        .from('items')
        .insert({
          list_id: session.listId,
          text: text.trim(),
          category,
          added_by: displayName,
        })
        .select()
        .single()

      if (insertError) throw insertError

      saveRecentItem(session.listId, text.trim(), category)
      setItems((prev) => sortItems([...prev, data as GroceryItem]))
    },
    [session.listId, session.displayName],
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
    deleteItem,
    clearChecked,
    refetch,
  }
}
