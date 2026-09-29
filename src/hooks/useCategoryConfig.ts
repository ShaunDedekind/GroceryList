import { useCallback, useEffect, useMemo, useState } from 'react'
import type {
  CategoryConfig,
  HomeCategoryConfig,
  HenryCategoryConfig,
  ListSection,
} from '../types'
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
  getVisibleHenryCategories,
  parseHenryCategoryConfig,
  resolveHenryCategories,
  type ResolvedHenryCategory,
} from '../lib/henryCategoryConfig'
import {
  fetchCategoryConfig,
  fetchHomeCategoryConfig,
  fetchHenryCategoryConfig,
  updateCategoryConfig,
  updateHomeCategoryConfig,
  updateHenryCategoryConfig,
} from '../lib/supabase'
import { supabase } from '../lib/supabase'

export function useCategoryConfig(listId: string, section: ListSection = 'grocery') {
  const [groceryConfig, setGroceryConfig] = useState<CategoryConfig>({})
  const [homeConfig, setHomeConfig] = useState<HomeCategoryConfig>({})
  const [henryConfig, setHenryConfig] = useState<HenryCategoryConfig>({})
  const [loading, setLoading] = useState(true)

  const loadConfig = useCallback(async () => {
    try {
      if (section === 'home') {
        setHomeConfig(await fetchHomeCategoryConfig(listId))
      } else if (section === 'henry') {
        setHenryConfig(await fetchHenryCategoryConfig(listId))
      } else {
        setGroceryConfig(await fetchCategoryConfig(listId))
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
        } else if (section === 'henry') {
          const next = await fetchHenryCategoryConfig(listId)
          if (!cancelled) setHenryConfig(next)
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
            henry_category_config?: unknown
          }
          if (section === 'home') {
            setHomeConfig(parseHomeCategoryConfig(row.home_category_config))
          } else if (section === 'henry') {
            setHenryConfig(parseHenryCategoryConfig(row.henry_category_config))
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
  const henryResolved = useMemo(
    () => resolveHenryCategories(henryConfig),
    [henryConfig],
  )

  const resolved =
    section === 'home'
      ? homeResolved
      : section === 'henry'
        ? henryResolved
        : groceryResolved

  const visibleCategories = useMemo(() => {
    if (section === 'home') return getVisibleHomeCategories(homeResolved)
    if (section === 'henry') return getVisibleHenryCategories(henryResolved)
    return getVisibleCategories(groceryResolved)
  }, [section, groceryResolved, homeResolved, henryResolved])

  const categoryIds = useMemo(
    () => resolved.map((category) => category.id),
    [resolved],
  )

  const saveConfig = useCallback(
    async (
      next: CategoryConfig | HomeCategoryConfig | HenryCategoryConfig,
    ) => {
      if (section === 'home') {
        await updateHomeCategoryConfig(listId, next as HomeCategoryConfig)
        setHomeConfig(next as HomeCategoryConfig)
      } else if (section === 'henry') {
        await updateHenryCategoryConfig(listId, next as HenryCategoryConfig)
        setHenryConfig(next as HenryCategoryConfig)
      } else {
        await updateCategoryConfig(listId, next as CategoryConfig)
        setGroceryConfig(next as CategoryConfig)
      }
    },
    [listId, section],
  )

  const config =
    section === 'home'
      ? homeConfig
      : section === 'henry'
        ? henryConfig
        : groceryConfig

  return {
    config,
    resolved,
    visibleCategories,
    categoryIds,
    loading,
    saveConfig,
    refetch: loadConfig,
    groceryResolved,
    homeResolved,
    henryResolved,
  }
}

export type { ResolvedCategory, ResolvedHomeCategory, ResolvedHenryCategory }
