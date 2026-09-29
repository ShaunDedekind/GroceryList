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
import { mergeServerItem, mergeServerItems } from '../lib/itemSync'
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
    due_at: raw.due_at ?? null,
    note: raw.note ?? null,
  }
}

function sameItemList(current: GroceryItem[], next: GroceryItem[]): boolean {
  if (current.length !== next.length) return false
  for (let i = 0; i < current.length; i++) {
    if (current[i] !== next[i]) return false
  }
  return true
}

export interface UseItemsOptions {
  section: ListSection
  onRemoteInsert?: (item: GroceryItem) => void
  active?: boolean
}

export function useItems(session: Session, options: UseItemsOptions) {
  const { section, onRemoteInsert, active = true } = options
  const [items, setItems] = useState<GroceryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isDraggingRef = useRef(false)
  const pendingChecksRef = useRef(new Map<string, boolean>())
  const checkGenerationRef = useRef(new Map<string, number>())
  const syncGenerationRef = useRef(0)

  const applyFetchResult = useCallback(
    (data: GroceryItem[] | null, fetchError: Error | null) => {
      if (fetchError) {
        console.error('Failed to fetch items:', fetchError.message)
        setError(fetchError.message)
        return
      }

      if (isDraggingRef.current) return

      const incoming = (data ?? []).map(normalizeItem)
      setItems((prev) => {
        const next = sortItems(
          mergeServerItems(prev, incoming, pendingChecksRef.current),
        )
        return sameItemList(prev, next) ? prev : next
      })
      setError(null)
    },
    [],
  )

  const pollItems = useCallback(async () => {
    if (isDraggingRef.current) return
    const generation = syncGenerationRef.current
    const { data, error: fetchError } = await loadItems(session.listId, section)
    if (generation !== syncGenerationRef.current) return
    applyFetchResult(
      data as GroceryItem[] | null,
      fetchError ? new Error(fetchError.message) : null,
    )
  }, [session.listId, section, applyFetchResult])

  const refetch = useCallback(async () => {
    const generation = syncGenerationRef.current
    const { data, error: fetchError } = await loadItems(session.listId, section)
    if (generation !== syncGenerationRef.current) return
    applyFetchResult(
      data as GroceryItem[] | null,
      fetchError ? new Error(fetchError.message) : null,
    )
  }, [session.listId, section, applyFetchResult])

  useEffect(() => {
    let cancelled = false

    async function initialLoad() {
      const generation = syncGenerationRef.current
      const { data, error: fetchError } = await loadItems(session.listId, section)

      if (cancelled) return

      if (generation === syncGenerationRef.current) {
        applyFetchResult(
          data as GroceryItem[] | null,
          fetchError ? new Error(fetchError.message) : null,
        )
      }
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
            setItems((prev) => {
              const next = sortItems(
                mergeServerItem(prev, updated, pendingChecksRef.current),
              )
              return sameItemList(prev, next) ? prev : next
            })
          } else if (payload.eventType === 'DELETE') {
            setItems((prev) =>
              prev.filter((item) => item.id !== payload.old.id),
            )
          }
        },
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [
    session.listId,
    session.displayName,
    section,
    applyFetchResult,
    onRemoteInsert,
  ])

  useEffect(() => {
    if (!active) return
    const pollInterval = setInterval(() => {
      void pollItems()
    }, 3000)
    return () => clearInterval(pollInterval)
  }, [active, pollItems])

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void refetch()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [refetch])

  const skipActiveRefetch = useRef(active)
  useEffect(() => {
    if (!active) return
    if (skipActiveRefetch.current) {
      skipActiveRefetch.current = false
      return
    }
    const id = window.setTimeout(() => {
      void refetch()
    }, 0)
    return () => window.clearTimeout(id)
  }, [active, refetch])

  const setDragging = useCallback((dragging: boolean) => {
    isDraggingRef.current = dragging
  }, [])

  const addItem = useCallback(
    async (
      text: string,
      category: ItemCategoryId,
      extras?: { due_at?: string | null; note?: string | null },
    ) => {
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
          due_at: extras?.due_at ?? null,
          note: extras?.note?.trim() || null,
        })
        .select()
        .single()

      if (insertError) throw insertError

      if (section === 'home') {
        saveRecentHomeItem(session.listId, text.trim(), category as HomeCategoryId)
      } else if (section === 'grocery') {
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
    const generation = (checkGenerationRef.current.get(id) ?? 0) + 1
    checkGenerationRef.current.set(id, generation)
    pendingChecksRef.current.set(id, checked)
    syncGenerationRef.current += 1

    setItems((prev) =>
      sortItems(
        prev.map((item) => (item.id === id ? { ...item, checked } : item)),
      ),
    )

    try {
      const { data, error: updateError } = await supabase
        .from('items')
        .update({ checked })
        .eq('id', id)
        .select()
        .single()

      if (checkGenerationRef.current.get(id) !== generation) return

      if (updateError) {
        pendingChecksRef.current.delete(id)
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
        const saved = normalizeItem(data as GroceryItem)
        setItems((prev) => {
          if (checkGenerationRef.current.get(id) !== generation) return prev
          pendingChecksRef.current.delete(id)
          return sortItems(
            prev.map((item) => (item.id === id ? saved : item)),
          )
        })
      } else {
        pendingChecksRef.current.delete(id)
      }
    } finally {
      syncGenerationRef.current += 1
    }
  }, [])

  const updateItem = useCallback(
    async (
      id: string,
      updates: {
        text?: string
        category?: ItemCategoryId
        due_at?: string | null
        note?: string | null
      },
    ) => {
      const trimmedText = updates.text?.trim()
      const patch: {
        text?: string
        category?: ItemCategoryId
        due_at?: string | null
        note?: string | null
      } = {}
      if (trimmedText) patch.text = trimmedText
      if (updates.category) patch.category = updates.category
      if (updates.due_at !== undefined) patch.due_at = updates.due_at
      if (updates.note !== undefined) {
        patch.note = updates.note?.trim() || null
      }
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
