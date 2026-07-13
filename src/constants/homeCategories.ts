import type { HomeCategoryId } from '../types'

export interface HomeCategory {
  id: HomeCategoryId
  label: string
  emoji: string
}

export const HOME_CATEGORIES: HomeCategory[] = [
  { id: 'maintenance', label: 'Maintenance', emoji: '🔧' },
  { id: 'cleaning', label: 'Cleaning', emoji: '🧽' },
  { id: 'supplies', label: 'Supplies', emoji: '📦' },
  { id: 'projects', label: 'Projects', emoji: '🔨' },
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

export function getHomeCategoryLabel(id: HomeCategoryId): string {
  return HOME_CATEGORY_MAP[id]?.label ?? 'Other'
}

export function getHomeCategoryEmoji(id: HomeCategoryId): string {
  return HOME_CATEGORY_MAP[id]?.emoji ?? '📋'
}

export function isHomeCategoryId(value: unknown): value is HomeCategoryId {
  return typeof value === 'string' && value in HOME_CATEGORY_MAP
}
