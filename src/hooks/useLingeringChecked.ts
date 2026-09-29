import { useCallback, useEffect, useRef, useState } from 'react'

const LINGER_MS = 1000

export function useLingeringChecked(showDone: boolean) {
  const [ids, setIds] = useState<ReadonlySet<string>>(() => new Set())
  const timers = useRef(new Map<string, number>())

  const release = useCallback((id: string) => {
    const timer = timers.current.get(id)
    if (timer) {
      window.clearTimeout(timer)
      timers.current.delete(id)
    }
    setIds((current) => {
      if (!current.has(id)) return current
      const next = new Set(current)
      next.delete(id)
      return next
    })
  }, [])

  const retain = useCallback(
    (id: string) => {
      if (showDone) return
      const existing = timers.current.get(id)
      if (existing) window.clearTimeout(existing)

      setIds((current) => {
        if (current.has(id)) return current
        const next = new Set(current)
        next.add(id)
        return next
      })

      const timer = window.setTimeout(() => {
        timers.current.delete(id)
        setIds((current) => {
          if (!current.has(id)) return current
          const next = new Set(current)
          next.delete(id)
          return next
        })
      }, LINGER_MS)
      timers.current.set(id, timer)
    },
    [showDone],
  )

  useEffect(() => {
    const pending = timers.current
    return () => {
      for (const timer of pending.values()) window.clearTimeout(timer)
      pending.clear()
    }
  }, [])

  return { lingeringIds: ids, retain, release }
}
