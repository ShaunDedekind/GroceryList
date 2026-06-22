import type { Session } from '../types'

const SESSION_KEY = 'grocery-list-session'

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as Session
    if (!session.listId || !session.listCode || !session.displayName) return null
    return session
  } catch {
    return null
  }
}

export function saveSession(session: Session): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY)
}

export function updateSessionName(listName: string): void {
  const session = getSession()
  if (session) {
    saveSession({ ...session, listName })
  }
}

export function updateSessionDisplayName(displayName: string): void {
  const session = getSession()
  if (session) {
    saveSession({ ...session, displayName: displayName.trim() })
  }
}
