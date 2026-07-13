import type { CategoryId } from '../types'

export interface Category {
  id: CategoryId
  label: string
  emoji: string
}

export const CATEGORIES: Category[] = [
  { id: 'fruit_veg', label: 'Fruit & Veg', emoji: '🥬' },
  { id: 'snacks', label: 'Snacks', emoji: '🍿' },
  { id: 'meat', label: 'Meat & Fish', emoji: '🥩' },
  { id: 'dairy', label: 'Dairy & Eggs', emoji: '🥛' },
  { id: 'deli', label: 'Deli & Prepared', emoji: '🥪' },
  { id: 'bakery', label: 'Bakery', emoji: '🍞' },
  { id: 'pantry', label: 'Pantry', emoji: '🫙' },
  { id: 'frozen', label: 'Frozen', emoji: '🧊' },
  { id: 'drinks', label: 'Drinks', emoji: '🥤' },
  { id: 'personal_care', label: 'Personal Care', emoji: '🧴' },
  { id: 'household', label: 'Household', emoji: '🧹' },
  { id: 'other', label: 'Other', emoji: '📦' },
]

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
) as Record<CategoryId, Category>

export const DEFAULT_CATEGORY_ORDER: CategoryId[] = CATEGORIES.map((c) => c.id)

export const DEFAULT_CATEGORY: CategoryId = 'other'

export function getCategoryLabel(id: CategoryId): string {
  return CATEGORY_MAP[id]?.label ?? 'Other'
}

export function getCategoryEmoji(id: CategoryId): string {
  return CATEGORY_MAP[id]?.emoji ?? '📦'
}

export function isCategoryId(value: unknown): value is CategoryId {
  return typeof value === 'string' && value in CATEGORY_MAP
}
