export type ListSection = 'grocery' | 'home'

export type CategoryId =
  | 'fruit_veg'
  | 'snacks'
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

export type HomeCategoryId =
  | 'maintenance'
  | 'cleaning'
  | 'supplies'
  | 'projects'
  | 'garden'
  | 'kids'
  | 'pets'
  | 'other'

export type ItemCategoryId = CategoryId | HomeCategoryId

export interface CategoryConfig {
  order?: CategoryId[]
  hidden?: CategoryId[]
  labels?: Partial<Record<CategoryId, string>>
}

export interface HomeCategoryConfig {
  order?: HomeCategoryId[]
  hidden?: HomeCategoryId[]
  labels?: Partial<Record<HomeCategoryId, string>>
}

export interface GroceryList {
  id: string
  code: string
  name: string
  category_config?: CategoryConfig
  home_category_config?: HomeCategoryConfig
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
}

export interface Session {
  listId: string
  listCode: string
  listName: string
  displayName: string
}
