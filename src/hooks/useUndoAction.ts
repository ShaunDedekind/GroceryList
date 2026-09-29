import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

interface UndoRequest {
  message: string
  itemIds: string[]
  commit: () => Promise<void> | void
}

export function useUndoAction() {
  const [pending, setPending] = useState<UndoRequest | null>(null)
  const pendingRef = useRef<UndoRequest | null>(null)
  const timerRef = useRef<number | null>(null)

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const commitPending = useCallback(() => {
    const current = pendingRef.current
    if (!current) return
    pendingRef.current = null
    clearTimer()
    setPending(null)
    void current.commit()
  }, [])

  const undo = useCallback(() => {
    pendingRef.current = null
    clearTimer()
    setPending(null)
  }, [])

  const schedule = useCallback((next: UndoRequest) => {
    const previous = pendingRef.current
    clearTimer()
    pendingRef.current = next
    setPending(next)
    if (previous) void previous.commit()
    timerRef.current = window.setTimeout(() => {
      if (pendingRef.current !== next) return
      pendingRef.current = null
      timerRef.current = null
      setPending(null)
      void next.commit()
    }, 5000)
  }, [])

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') commitPending()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      commitPending()
    }
  }, [commitPending])

  const hiddenIds = useMemo(
    () => new Set(pending?.itemIds ?? []),
    [pending],
  )

  return {
    message: pending?.message ?? null,
    hiddenIds,
    schedule,
    undo,
  }
}
