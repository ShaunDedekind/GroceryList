import type { HomeCategoryId } from '../types'

export interface HomeCategory {
  id: HomeCategoryId
  label: string
  emoji: string
}

export const HOME_CATEGORIES: HomeCategory[] = [
  { id: 'maintenance', label: 'Maintenance', emoji: '🔧' },
  { id: 'purchases', label: 'Purchases', emoji: '🛒' },
  { id: 'bills', label: 'Bills', emoji: '💳' },
  { id: 'admin', label: 'Admin', emoji: '📞' },
  { id: 'cleaning', label: 'Cleaning', emoji: '🧽' },
  { id: 'supplies', label: 'Supplies', emoji: '📦' },
  { id: 'garden', label: 'Garden', emoji: '🌱' },
  { id: 'kids', label: 'Kids', emoji: '🧸' },
  { id: 'pets', label: 'Pets', emoji: '🐾' },
  { id: 'other', label: 'Other', emoji: '📋' },
]

export const HOME_CATEGORY_MAP = Object.fromEntries(
  HOME_CATEGORIES.map((c) => [c.id, c]),
) as Record<HomeCategoryId, HomeCategory>

export const DEFAULT_HOME_CATEGORY_ORDER: HomeCategoryId[] = HOME_CATEGORIES.map(
  (c) => c.id,
)

export const DEFAULT_HOME_CATEGORY: HomeCategoryId = 'other'

export function normalizeHomeCategoryId(value: unknown): HomeCategoryId {
  if (value === 'projects') return 'purchases'
  if (typeof value === 'string' && value in HOME_CATEGORY_MAP) {
    return value as HomeCategoryId
  }
  return 'other'
}

export function getHomeCategoryLabel(id: HomeCategoryId): string {
  return HOME_CATEGORY_MAP[normalizeHomeCategoryId(id)]?.label ?? 'Other'
}

export function getHomeCategoryEmoji(id: HomeCategoryId): string {
  return HOME_CATEGORY_MAP[normalizeHomeCategoryId(id)]?.emoji ?? '📋'
}

export function isHomeCategoryId(value: unknown): value is HomeCategoryId {
  if (value === 'projects') return true
  return typeof value === 'string' && value in HOME_CATEGORY_MAP
}
