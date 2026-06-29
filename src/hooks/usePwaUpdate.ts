import { useCallback, useEffect, useRef } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000

export function usePwaUpdate() {
  const isDev = import.meta.env.DEV
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: !isDev,
    onRegistered(registration) {
      if (!registration) return
      registrationRef.current = registration

      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }

      intervalRef.current = setInterval(() => {
        registration.update().catch(() => {})
      }, UPDATE_CHECK_INTERVAL_MS)
    },
    onRegisterError(error) {
      console.error('Service worker registration failed:', error)
    },
  })

  const checkForUpdate = useCallback(() => {
    registrationRef.current?.update().catch(() => {})
  }, [])

  useEffect(() => {
    if (isDev) return

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkForUpdate()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isDev, checkForUpdate])

  const refresh = useCallback(async () => {
    await updateServiceWorker(true)
  }, [updateServiceWorker])

  const dismiss = useCallback(() => {
    setNeedRefresh(false)
  }, [setNeedRefresh])

  return {
    needRefresh: isDev ? false : needRefresh,
    offlineReady: isDev ? false : offlineReady,
    refresh: isDev ? async () => {} : refresh,
    dismiss: isDev ? () => {} : dismiss,
    checkForUpdate: isDev ? () => {} : checkForUpdate,
  }
}
