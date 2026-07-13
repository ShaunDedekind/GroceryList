import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CategoryConfig } from '../types'
import {
  getVisibleCategories,
  parseCategoryConfig,
  resolveCategories,
  type ResolvedCategory,
} from '../lib/categoryConfig'
import { fetchCategoryConfig, updateCategoryConfig } from '../lib/supabase'
import { supabase } from '../lib/supabase'

export function useCategoryConfig(listId: string) {
  const [config, setConfig] = useState<CategoryConfig>({})
  const [loading, setLoading] = useState(true)

  const loadConfig = useCallback(async () => {
    try {
      const next = await fetchCategoryConfig(listId)
      setConfig(next)
    } catch (error) {
      console.error('Failed to load category config:', error)
    } finally {
      setLoading(false)
    }
  }, [listId])

  useEffect(() => {
    let cancelled = false

    async function initialLoad() {
      try {
        const next = await fetchCategoryConfig(listId)
        if (!cancelled) setConfig(next)
      } catch (error) {
        console.error('Failed to load category config:', error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    initialLoad()

    const channel = supabase
      .channel(`list-config:${listId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'lists',
          filter: `id=eq.${listId}`,
        },
        (payload) => {
          const next = parseCategoryConfig(
            (payload.new as { category_config?: unknown }).category_config,
          )
          setConfig(next)
        },
      )
      .subscribe()

    const poll = window.setInterval(loadConfig, 3000)

    return () => {
      cancelled = true
      window.clearInterval(poll)
      supabase.removeChannel(channel)
    }
  }, [listId, loadConfig])

  const resolved = useMemo(() => resolveCategories(config), [config])
  const visibleCategories = useMemo(
    () => getVisibleCategories(resolved),
    [resolved],
  )
  const categoryIds = useMemo(
    () => resolved.map((category) => category.id),
    [resolved],
  )

  const saveConfig = useCallback(
    async (next: CategoryConfig) => {
      await updateCategoryConfig(listId, next)
      setConfig(next)
    },
    [listId],
  )

  return {
    config,
    resolved,
    visibleCategories,
    categoryIds,
    loading,
    saveConfig,
    refetch: loadConfig,
  }
}

export type { ResolvedCategory }
