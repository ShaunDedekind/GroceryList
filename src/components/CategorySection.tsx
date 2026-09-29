import { useDroppable } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import type { GroceryItem } from '../types'
import { ItemRow } from './ItemRow'

interface CategorySectionProps {
  categoryId: string
  categoryLabel: string
  categoryEmoji: string
  items: GroceryItem[]
  currentUserName: string
  onToggle: (id: string, checked: boolean) => void
  onDelete: (id: string) => void
  onEdit: (item: GroceryItem) => void
  isDragActive?: boolean
  forceVisible?: boolean
  reorderMode?: boolean
}

export function CategorySection({
  categoryId,
  categoryLabel,
  categoryEmoji,
  items,
  currentUserName,
  onToggle,
  onDelete,
  onEdit,
  isDragActive = false,
  forceVisible = false,
  reorderMode = false,
}: CategorySectionProps) {
  const reducedMotion = useReducedMotion()
  const unchecked = items.filter((i) => !i.checked).length

  const { setNodeRef, isOver } = useDroppable({ id: categoryId })

  if (items.length === 0 && !forceVisible) return null

  const itemIds = items.map((item) => item.id)
  const showDropZone = isDragActive && items.length === 0
  const count = unchecked > 0 ? unchecked : items.length

  return (
    <motion.section layout={!reducedMotion ? 'position' : false} className="mb-1">
      <h2 className="sticky top-0 z-[1] bg-cream/95 px-1 py-1 text-meta font-semibold uppercase tracking-wide text-warm-gray backdrop-blur-sm dark:bg-surface/95 dark:text-warm-gray-light">
        <span className="mr-1" aria-hidden="true">
          {categoryEmoji}
        </span>
        {categoryLabel}
        <span className="font-medium text-warm-gray-light"> · {count}</span>
      </h2>

      <div
        ref={setNodeRef}
        className={`${isOver ? 'ring-1 ring-sage/30 rounded-[var(--radius-sm)]' : ''} ${
          showDropZone ? 'min-h-10' : ''
        }`}
      >
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          <AnimatePresence mode="popLayout">
            {items.map((item, index) => (
              <ItemRow
                key={item.id}
                item={item}
                currentUserName={currentUserName}
                onToggle={onToggle}
                onDelete={onDelete}
                onEdit={onEdit}
                reorderMode={reorderMode}
                showSeparator={index < items.length - 1}
              />
            ))}
          </AnimatePresence>
        </SortableContext>
        {showDropZone && (
          <p className="px-3 py-2 text-center text-footnote text-warm-gray-light">
            Drop here
          </p>
        )}
      </div>
    </motion.section>
  )
}
