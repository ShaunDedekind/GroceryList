import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CategoryConfig, HomeCategoryConfig, ListSection } from '../types'
import {
  getVisibleCategories,
  parseCategoryConfig,
  resolveCategories,
  type ResolvedCategory,
} from '../lib/categoryConfig'
import {
  getVisibleHomeCategories,
  parseHomeCategoryConfig,
  resolveHomeCategories,
  type ResolvedHomeCategory,
} from '../lib/homeCategoryConfig'
import {
  fetchCategoryConfig,
  fetchHomeCategoryConfig,
  updateCategoryConfig,
  updateHomeCategoryConfig,
} from '../lib/supabase'
import { supabase } from '../lib/supabase'

export function useCategoryConfig(listId: string, section: ListSection = 'grocery') {
  const [groceryConfig, setGroceryConfig] = useState<CategoryConfig>({})
  const [homeConfig, setHomeConfig] = useState<HomeCategoryConfig>({})
  const [loading, setLoading] = useState(true)

  const loadConfig = useCallback(async () => {
    try {
      if (section === 'home') {
        const next = await fetchHomeCategoryConfig(listId)
        setHomeConfig(next)
      } else {
        const next = await fetchCategoryConfig(listId)
        setGroceryConfig(next)
      }
    } catch (error) {
      console.error('Failed to load category config:', error)
    } finally {
      setLoading(false)
    }
  }, [listId, section])

  useEffect(() => {
    let cancelled = false

    async function initialLoad() {
      try {
        if (section === 'home') {
          const next = await fetchHomeCategoryConfig(listId)
          if (!cancelled) setHomeConfig(next)
        } else {
          const next = await fetchCategoryConfig(listId)
          if (!cancelled) setGroceryConfig(next)
        }
      } catch (error) {
        console.error('Failed to load category config:', error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    initialLoad()

    const channel = supabase
      .channel(`list-config:${section}:${listId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'lists',
          filter: `id=eq.${listId}`,
        },
        (payload) => {
          const row = payload.new as {
            category_config?: unknown
            home_category_config?: unknown
          }
          if (section === 'home') {
            setHomeConfig(parseHomeCategoryConfig(row.home_category_config))
          } else {
            setGroceryConfig(parseCategoryConfig(row.category_config))
          }
        },
      )
      .subscribe()

    const poll = window.setInterval(loadConfig, 3000)

    return () => {
      cancelled = true
      window.clearInterval(poll)
      supabase.removeChannel(channel)
    }
  }, [listId, section, loadConfig])

  const groceryResolved = useMemo(
    () => resolveCategories(groceryConfig),
    [groceryConfig],
  )
  const homeResolved = useMemo(
    () => resolveHomeCategories(homeConfig),
    [homeConfig],
  )

  const resolved = section === 'home' ? homeResolved : groceryResolved
  const visibleCategories = useMemo(() => {
    if (section === 'home') {
      return getVisibleHomeCategories(homeResolved)
    }
    return getVisibleCategories(groceryResolved)
  }, [section, groceryResolved, homeResolved])

  const categoryIds = useMemo(
    () => resolved.map((category) => category.id),
    [resolved],
  )

  const saveConfig = useCallback(
    async (next: CategoryConfig | HomeCategoryConfig) => {
      if (section === 'home') {
        await updateHomeCategoryConfig(listId, next as HomeCategoryConfig)
        setHomeConfig(next as HomeCategoryConfig)
      } else {
        await updateCategoryConfig(listId, next as CategoryConfig)
        setGroceryConfig(next as CategoryConfig)
      }
    },
    [listId, section],
  )

  return {
    config: section === 'home' ? homeConfig : groceryConfig,
    resolved,
    visibleCategories,
    categoryIds,
    loading,
    saveConfig,
    refetch: loadConfig,
    groceryResolved,
    homeResolved,
  }
}

export type { ResolvedCategory, ResolvedHomeCategory }
