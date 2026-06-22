import { useCallback, useEffect, useState } from 'react'
import type { Session } from '../types'
import { getSession, saveSession, clearSession } from '../lib/storage'
import {
  createList,
  joinList,
  setListCode,
  initListCodeFromSession,
  isSupabaseConfigured,
} from '../lib/supabase'
import { withViewTransition } from '../lib/viewTransition'

export function useList() {
  const [session, setSession] = useState<Session | null>(() => getSession())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    initListCodeFromSession()
  }, [])

  const handleCreate = useCallback(async (displayName: string, listName?: string) => {
    setLoading(true)
    setError(null)
    try {
      const list = await createList(listName ?? 'Our Grocery List')
      const newSession: Session = {
        listId: list.id,
        listCode: list.code,
        listName: list.name,
        displayName: displayName.trim(),
      }
      saveSession(newSession)
      setListCode(list.code)
      withViewTransition(() => setSession(newSession))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create list')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleJoin = useCallback(async (code: string, displayName: string) => {
    setLoading(true)
    setError(null)
    try {
      const list = await joinList(code)
      const newSession: Session = {
        listId: list.id,
        listCode: list.code,
        listName: list.name,
        displayName: displayName.trim(),
      }
      saveSession(newSession)
      setListCode(list.code)
      withViewTransition(() => setSession(newSession))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to join list')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleLeave = useCallback(() => {
    clearSession()
    setListCode(null)
    withViewTransition(() => setSession(null))
  }, [])

  const updateListName = useCallback((name: string) => {
    if (!session) return
    const updated = { ...session, listName: name }
    saveSession(updated)
    setSession(updated)
  }, [session])

  return {
    session,
    loading,
    error,
    configured: isSupabaseConfigured(),
    createList: handleCreate,
    joinList: handleJoin,
    leaveList: handleLeave,
    updateListName,
    clearError: () => setError(null),
  }
}
