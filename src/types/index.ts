export type CategoryId =
  | 'fruit_veg'
  | 'meat'
  | 'dairy'
  | 'bakery'
  | 'pantry'
  | 'frozen'
  | 'drinks'
  | 'household'
  | 'other'

export interface GroceryList {
  id: string
  code: string
  name: string
  created_at: string
}

export interface GroceryItem {
  id: string
  list_id: string
  category: CategoryId
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
