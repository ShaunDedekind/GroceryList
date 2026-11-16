import type { HenryCategoryId } from '../types'

export interface HenryCategory {
  id: HenryCategoryId
  label: string
  emoji: string
}

export const HENRY_CATEGORIES: HenryCategory[] = [
  { id: 'health', label: 'Health', emoji: '🩺' },
  { id: 'activities', label: 'Activities', emoji: '🎈' },
  { id: 'admin', label: 'Admin', emoji: '📋' },
  { id: 'gear', label: 'Gear', emoji: '🧸' },
  { id: 'other', label: 'Other', emoji: '✨' },
]

export const HENRY_CATEGORY_MAP = Object.fromEntries(
  HENRY_CATEGORIES.map((c) => [c.id, c]),
) as Record<HenryCategoryId, HenryCategory>

export const DEFAULT_HENRY_CATEGORY_ORDER: HenryCategoryId[] = HENRY_CATEGORIES.map(
  (c) => c.id,
)

export const DEFAULT_HENRY_CATEGORY: HenryCategoryId = 'other'

export function normalizeHenryCategoryId(value: unknown): HenryCategoryId {
  if (value === 'appointments') return 'activities'
  if (value === 'supplies') return 'gear'
  if (typeof value === 'string' && value in HENRY_CATEGORY_MAP) {
    return value as HenryCategoryId
  }
  return 'other'
}

export function getHenryCategoryLabel(id: HenryCategoryId): string {
  return HENRY_CATEGORY_MAP[normalizeHenryCategoryId(id)]?.label ?? 'Other'
}

export function getHenryCategoryEmoji(id: HenryCategoryId): string {
  return HENRY_CATEGORY_MAP[normalizeHenryCategoryId(id)]?.emoji ?? '✨'
}

export function isHenryCategoryId(value: unknown): value is HenryCategoryId {
  if (value === 'appointments' || value === 'supplies') return true
  return typeof value === 'string' && value in HENRY_CATEGORY_MAP
}
