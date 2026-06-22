import type { CategoryId } from '../types'

export interface RecentItem {
  text: string
  category: CategoryId
}

const STORAGE_PREFIX = 'grocery-recent-'
const MAX_RECENT = 10

function storageKey(listId: string): string {
  return `${STORAGE_PREFIX}${listId}`
}

export function getRecentItems(listId: string): RecentItem[] {
  try {
    const raw = localStorage.getItem(storageKey(listId))
    if (!raw) return []
    return JSON.parse(raw) as RecentItem[]
  } catch {
    return []
  }
}

export function saveRecentItem(
  listId: string,
  text: string,
  category: CategoryId,
): void {
  const trimmed = text.trim()
  if (!trimmed) return

  const normalized = trimmed.toLowerCase()
  const existing = getRecentItems(listId).filter(
    (item) => item.text.toLowerCase() !== normalized,
  )

  const updated: RecentItem[] = [{ text: trimmed, category }, ...existing].slice(
    0,
    MAX_RECENT,
  )

  localStorage.setItem(storageKey(listId), JSON.stringify(updated))
}
