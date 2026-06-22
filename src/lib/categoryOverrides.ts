import type { CategoryId } from '../types'

const STORAGE_PREFIX = 'grocery-category-overrides-'
const MAX_OVERRIDES = 100

function storageKey(listId: string): string {
  return `${STORAGE_PREFIX}${listId}`
}

function normalize(text: string): string {
  return text.trim().toLowerCase()
}

function loadOverrides(listId: string): Record<string, CategoryId> {
  try {
    const raw = localStorage.getItem(storageKey(listId))
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, CategoryId>
  } catch {
    return {}
  }
}

function saveOverrides(listId: string, overrides: Record<string, CategoryId>): void {
  localStorage.setItem(storageKey(listId), JSON.stringify(overrides))
}

export function getOverride(listId: string, text: string): CategoryId | null {
  const key = normalize(text)
  if (!key) return null
  return loadOverrides(listId)[key] ?? null
}

export function saveOverride(
  listId: string,
  text: string,
  category: CategoryId,
): void {
  const key = normalize(text)
  if (!key) return

  const overrides = loadOverrides(listId)
  delete overrides[key]

  const entries = Object.entries(overrides)
  entries.unshift([key, category])

  const trimmed = Object.fromEntries(entries.slice(0, MAX_OVERRIDES))
  saveOverrides(listId, trimmed)
}
