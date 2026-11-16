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
  | 'purchases'
  | 'bills'
  | 'admin'
  | 'cleaning'
  | 'supplies'
  | 'garden'
  | 'kids'
  | 'pets'
  | 'other'
  /** @deprecated Mapped to purchases */
  | 'projects'

export type HenryCategoryId =
  | 'health'
  | 'admin'
  | 'activities'
  | 'gear'
  | 'other'
  /** @deprecated Mapped to activities */
  | 'appointments'
  /** @deprecated Mapped to gear */
  | 'supplies'

export type ItemCategoryId = CategoryId | HomeCategoryId | HenryCategoryId

export type ItemOwner = 'shaun' | 'rosie' | 'shared'

export type ItemKind =
  | 'task'
  | 'bill'
  | 'session'
  | 'maintenance'
  | 'purchase'
  | 'milestone'

export type ItemSource = 'manual' | 'email' | 'nl'

export interface RecurrenceRule {
  freq: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'seasonal'
  interval?: number
  byMonth?: number[]
  until?: string | null
}

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
  labels?: Partial<Record<string, string>>
}

export interface HenryCategoryConfig {
  order?: HenryCategoryId[]
  hidden?: HenryCategoryId[]
  labels?: Partial<Record<string, string>>
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
  owner: ItemOwner
  item_kind: ItemKind
  amount_cents: number | null
  provider: string | null
  paid_at: string | null
  recurrence: RecurrenceRule | null
  source?: ItemSource | null
  inbound_email_id?: string | null
}

export interface Session {
  listId: string
  listCode: string
  listName: string
  displayName: string
}
