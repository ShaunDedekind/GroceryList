import { useCallback, useEffect, useState } from 'react'
import type { ListSection } from '../types'
import { fetchUncheckedCounts } from '../lib/supabase'
import { supabase } from '../lib/supabase'

export function useSectionCounts(listId: string) {
  const [counts, setCounts] = useState({ grocery: 0, home: 0 })

  const refresh = useCallback(async () => {
    try {
      const next = await fetchUncheckedCounts(listId)
      setCounts(next)
    } catch (error) {
      console.error('Failed to fetch section counts:', error)
    }
  }, [listId])

  useEffect(() => {
    refresh()

    const channel = supabase
      .channel(`section-counts:${listId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'items',
          filter: `list_id=eq.${listId}`,
        },
        () => {
          refresh()
        },
      )
      .subscribe()

    const poll = window.setInterval(refresh, 5000)

    return () => {
      window.clearInterval(poll)
      supabase.removeChannel(channel)
    }
  }, [listId, refresh])

  return counts
}

const STORAGE_PREFIX = 'grocery:active-tab:'

function storageKey(listId: string): string {
  return `${STORAGE_PREFIX}${listId}`
}

function parseHashTab(): ListSection | null {
  if (typeof window === 'undefined') return null
  const hash = window.location.hash.replace('#', '')
  if (hash === 'home') return 'home'
  if (hash === 'shop' || hash === 'grocery') return 'grocery'
  return null
}

function readStoredTab(listId: string): ListSection {
  try {
    const raw = localStorage.getItem(storageKey(listId))
    if (raw === 'home' || raw === 'grocery') return raw
  } catch {
    // ignore
  }
  return 'grocery'
}

export function useActiveTab(listId: string) {
  const [activeTab, setActiveTabState] = useState<ListSection>(() => {
    return parseHashTab() ?? readStoredTab(listId)
  })

  const setActiveTab = useCallback(
    (tab: ListSection) => {
      setActiveTabState(tab)
      localStorage.setItem(storageKey(listId), tab)
      const hash = tab === 'home' ? '#home' : '#shop'
      if (window.location.hash !== hash) {
        window.history.replaceState(null, '', hash)
      }
    },
    [listId],
  )

  useEffect(() => {
    const onHashChange = () => {
      const fromHash = parseHashTab()
      if (fromHash) setActiveTabState(fromHash)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return { activeTab, setActiveTab }
}
