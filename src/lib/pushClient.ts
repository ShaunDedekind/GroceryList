import { getSession } from './storage'
import { inferOwnerFromName } from './ownership'

export async function enablePushNotifications(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false
  }
  if (!('PushManager' in window)) return false

  const session = getSession()
  if (!session?.listCode) return false

  const person = inferOwnerFromName(session.displayName)
  if (person === 'shared') return false

  try {
    const reg = await navigator.serviceWorker.ready
    const existing = await reg.pushManager.getSubscription()
    let subscription = existing

    if (!subscription) {
      const bootstrap = await fetch('/api/push-subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-list-code': session.listCode,
        },
        body: JSON.stringify({
          person,
          subscription: {
            endpoint: 'pending',
            keys: { p256dh: 'pending', auth: 'pending' },
          },
        }),
      })
      const data = (await bootstrap.json()) as { vapidPublicKey?: string | null }
      if (!data.vapidPublicKey) return false

      const key = urlBase64ToUint8Array(data.vapidPublicKey)
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: key,
      })
    }

    const json = subscription.toJSON()
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return false

    const res = await fetch('/api/push-subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-list-code': session.listCode,
      },
      body: JSON.stringify({
        person,
        subscription: {
          endpoint: json.endpoint,
          keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
        },
      }),
    })
    return res.ok
  } catch {
    return false
  }
}

function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i)
  return output
}
