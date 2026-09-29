import type { HenryCategoryId } from '../types'

export interface HenryCategory {
  id: HenryCategoryId
  label: string
  emoji: string
}

export const HENRY_CATEGORIES: HenryCategory[] = [
  { id: 'health', label: 'Health', emoji: '🩺' },
  { id: 'appointments', label: 'Appointments', emoji: '📅' },
  { id: 'admin', label: 'Admin', emoji: '📋' },
  { id: 'supplies', label: 'Supplies', emoji: '🍼' },
  { id: 'other', label: 'Other', emoji: '✨' },
]

export const HENRY_CATEGORY_MAP = Object.fromEntries(
  HENRY_CATEGORIES.map((c) => [c.id, c]),
) as Record<HenryCategoryId, HenryCategory>

export const DEFAULT_HENRY_CATEGORY_ORDER: HenryCategoryId[] = HENRY_CATEGORIES.map(
  (c) => c.id,
)

export const DEFAULT_HENRY_CATEGORY: HenryCategoryId = 'other'

export function getHenryCategoryLabel(id: HenryCategoryId): string {
  return HENRY_CATEGORY_MAP[id]?.label ?? 'Other'
}

export function getHenryCategoryEmoji(id: HenryCategoryId): string {
  return HENRY_CATEGORY_MAP[id]?.emoji ?? '✨'
}

export function isHenryCategoryId(value: unknown): value is HenryCategoryId {
  return typeof value === 'string' && value in HENRY_CATEGORY_MAP
}
