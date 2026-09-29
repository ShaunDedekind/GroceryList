import { AnimatePresence } from 'motion/react'
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
    <div className="overflow-hidden">
      <AnimatePresence initial={false}>
      {items.map((item, index) => (
        <ItemRow
          key={item.id}
          item={item}
          currentUserName={currentUserName}
          onToggle={onToggle}
          onDelete={onDelete}
          onEdit={onEdit}
          showSeparator={index < items.length - 1}
        />
      ))}
      </AnimatePresence>
    </div>
  )
}
