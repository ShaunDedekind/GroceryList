import { useCallback, useRef, useState, type RefObject } from 'react'

const PULL_THRESHOLD = 72
const MAX_PULL = 96

interface PullToRefreshState {
  pullDistance: number
  isRefreshing: boolean
}

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>
  enabled?: boolean
}

export function usePullToRefresh(
  containerRef: RefObject<HTMLElement | null>,
  { onRefresh, enabled = true }: UsePullToRefreshOptions,
) {
  const [state, setState] = useState<PullToRefreshState>({
    pullDistance: 0,
    isRefreshing: false,
  })
  const startY = useRef(0)
  const pulling = useRef(false)
  const pullDistanceRef = useRef(0)

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled || state.isRefreshing) return
      const el = containerRef.current
      if (!el || el.scrollTop > 0) return
      startY.current = e.touches[0].clientY
      pulling.current = true
    },
    [containerRef, enabled, state.isRefreshing],
  )

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!pulling.current || !enabled) return
      const delta = e.touches[0].clientY - startY.current
      if (delta <= 0) {
        pullDistanceRef.current = 0
        setState((s) => ({ ...s, pullDistance: 0 }))
        return
      }
      const distance = Math.min(delta * 0.45, MAX_PULL)
      pullDistanceRef.current = distance
      setState((s) => ({ ...s, pullDistance: distance }))
    },
    [enabled],
  )

  const onTouchEnd = useCallback(async () => {
    if (!pulling.current || !enabled) return
    pulling.current = false

    const shouldRefresh = pullDistanceRef.current >= PULL_THRESHOLD
    pullDistanceRef.current = 0
    setState({ pullDistance: 0, isRefreshing: shouldRefresh })

    if (shouldRefresh) {
      try {
        await onRefresh()
      } finally {
        setState({ pullDistance: 0, isRefreshing: false })
      }
    }
  }, [enabled, onRefresh])

  return {
    ...state,
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
  }
}
