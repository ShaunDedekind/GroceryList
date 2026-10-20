export type ListSection = 'grocery' | 'home' | 'henry'

export type BuiltinCategoryId =
  | 'fruit_veg'
  | 'snacks'
  | 'sweet_tooth'
  | 'meat'
  | 'dairy'
  | 'deli'
  | 'bakery'
  | 'pantry'
  | 'frozen'
  | 'drinks'
  | 'personal_care'
  | 'household'
  | 'other'

/** Built-in aisle IDs, or synced custom IDs matching `custom_*`. */
export type CategoryId = BuiltinCategoryId | (string & {})

export type HomeCategoryId =
  | 'maintenance'
  | 'cleaning'
  | 'supplies'
  | 'projects'
  | 'garden'
  | 'kids'
  | 'pets'
  | 'other'

export type HenryCategoryId =
  | 'health'
  | 'appointments'
  | 'admin'
  | 'supplies'
  | 'other'

export type ItemCategoryId = CategoryId | HomeCategoryId | HenryCategoryId

export interface CustomCategory {
  id: string
  label: string
  emoji: string
  keywords?: string[]
}

export interface CategoryConfig {
  order?: CategoryId[]
  hidden?: CategoryId[]
  labels?: Partial<Record<string, string>>
  custom?: CustomCategory[]
}

export interface HomeCategoryConfig {
  order?: HomeCategoryId[]
  hidden?: HomeCategoryId[]
  labels?: Partial<Record<HomeCategoryId, string>>
}

export interface HenryCategoryConfig {
  order?: HenryCategoryId[]
  hidden?: HenryCategoryId[]
  labels?: Partial<Record<HenryCategoryId, string>>
}

export interface GroceryList {
  id: string
  code: string
  name: string
  category_config?: CategoryConfig
  home_category_config?: HomeCategoryConfig
  henry_category_config?: HenryCategoryConfig
  created_at: string
}

export interface GroceryItem {
  id: string
  list_id: string
  section: ListSection
  category: ItemCategoryId
  text: string
  checked: boolean
  added_by: string | null
  sort_order: number
  created_at: string
  updated_at: string
  due_at: string | null
  note: string | null
}

export interface Session {
  listId: string
  listCode: string
  listName: string
  displayName: string
}
