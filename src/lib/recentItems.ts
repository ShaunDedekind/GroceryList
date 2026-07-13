import type { CategoryId } from '../types'
import type { HomeCategoryId } from '../types'

export interface RecentItem {
  text: string
  category: CategoryId
}

export interface RecentHomeItem {
  text: string
  category: HomeCategoryId
}

const GROCERY_PREFIX = 'grocery-recent-'
const HOME_PREFIX = 'grocery-home-recent-'
const MAX_RECENT = 10

function groceryKey(listId: string): string {
  return `${GROCERY_PREFIX}${listId}`
}

function homeKey(listId: string): string {
  return `${HOME_PREFIX}${listId}`
}

export function getRecentItems(listId: string): RecentItem[] {
  try {
    const raw = localStorage.getItem(groceryKey(listId))
    if (!raw) return []
    return JSON.parse(raw) as RecentItem[]
  } catch {
    return []
  }
}

export function getRecentHomeItems(listId: string): RecentHomeItem[] {
  try {
    const raw = localStorage.getItem(homeKey(listId))
    if (!raw) return []
    return JSON.parse(raw) as RecentHomeItem[]
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

  localStorage.setItem(groceryKey(listId), JSON.stringify(updated))
}

export function saveRecentHomeItem(
  listId: string,
  text: string,
  category: HomeCategoryId,
): void {
  const trimmed = text.trim()
  if (!trimmed) return

  const normalized = trimmed.toLowerCase()
  const existing = getRecentHomeItems(listId).filter(
    (item) => item.text.toLowerCase() !== normalized,
  )

  const updated: RecentHomeItem[] = [
    { text: trimmed, category },
    ...existing,
  ].slice(0, MAX_RECENT)

  localStorage.setItem(homeKey(listId), JSON.stringify(updated))
}
