import type { BuiltinCategoryId, CategoryId } from '../types'

export interface Category {
  id: CategoryId
  label: string
  emoji: string
}

export const BUILTIN_CATEGORIES: Category[] = [
  { id: 'fruit_veg', label: 'Fruit & Veg', emoji: '🥬' },
  { id: 'snacks', label: 'Snacks', emoji: '🍿' },
  { id: 'sweet_tooth', label: 'Sweet Tooth', emoji: '🍫' },
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

/** @deprecated Prefer BUILTIN_CATEGORIES; kept for callers that expect CATEGORIES. */
export const CATEGORIES = BUILTIN_CATEGORIES

export const BUILTIN_CATEGORY_MAP = Object.fromEntries(
  BUILTIN_CATEGORIES.map((c) => [c.id, c]),
) as Record<BuiltinCategoryId, Category>

/** @deprecated Prefer BUILTIN_CATEGORY_MAP. */
export const CATEGORY_MAP = BUILTIN_CATEGORY_MAP

export const DEFAULT_CATEGORY_ORDER: BuiltinCategoryId[] = BUILTIN_CATEGORIES.map(
  (c) => c.id as BuiltinCategoryId,
)

export const DEFAULT_CATEGORY: BuiltinCategoryId = 'other'

const CUSTOM_ID_PATTERN = /^custom_[a-z0-9]+(?:_[a-z0-9]+)*$/

export function isBuiltinCategoryId(value: unknown): value is BuiltinCategoryId {
  return typeof value === 'string' && value in BUILTIN_CATEGORY_MAP
}

export function isCustomCategoryId(value: unknown): value is string {
  return typeof value === 'string' && CUSTOM_ID_PATTERN.test(value)
}

export function isCategoryId(value: unknown): value is CategoryId {
  return isBuiltinCategoryId(value) || isCustomCategoryId(value)
}

export function createCustomCategoryId(label: string): string {
  const slug = label
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 24)

  const base = slug || 'aisle'
  const suffix = Math.random().toString(36).slice(2, 6)
  return `custom_${base}_${suffix}`
}

export function getCategoryLabel(id: CategoryId): string {
  if (isBuiltinCategoryId(id)) return BUILTIN_CATEGORY_MAP[id].label
  return 'Other'
}

export function getCategoryEmoji(id: CategoryId): string {
  if (isBuiltinCategoryId(id)) return BUILTIN_CATEGORY_MAP[id].emoji
  return '📦'
}
