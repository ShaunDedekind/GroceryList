import type { GroceryItem } from '../types'
import { ItemRow } from './ItemRow'

interface ShopFlatListProps {
  items: GroceryItem[]
  currentUserName: string
  onToggle: (id: string, checked: boolean) => void
  onDelete: (id: string) => void
  onEdit: (item: GroceryItem) => void
}

export function ShopFlatList({
  items,
  currentUserName,
  onToggle,
  onDelete,
  onEdit,
}: ShopFlatListProps) {
  return (
    <div className="px-1">
      {items.map((item) => (
        <ItemRow
          key={item.id}
          item={item}
          currentUserName={currentUserName}
          onToggle={onToggle}
          onDelete={onDelete}
          onEdit={onEdit}
          shopMode
        />
      ))}
    </div>
  )
}
