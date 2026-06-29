import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import type { CategoryId, GroceryItem } from '../types'
import { getCategoryEmoji, getCategoryLabel } from '../constants/categories'
import { ItemRow } from './ItemRow'
import { spring } from '../lib/motion'

interface CategorySectionProps {
  categoryId: CategoryId
  items: GroceryItem[]
  currentUserName: string
  onToggle: (id: string, checked: boolean) => void
  onDelete: (id: string) => void
  onEdit: (item: GroceryItem) => void
  isDragActive?: boolean
  forceVisible?: boolean
  reorderMode?: boolean
  defaultOpen?: boolean
}

export function CategorySection({
  categoryId,
  items,
  currentUserName,
  onToggle,
  onDelete,
  onEdit,
  isDragActive = false,
  forceVisible = false,
  reorderMode = false,
  defaultOpen = true,
}: CategorySectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  const reducedMotion = useReducedMotion()
  const unchecked = items.filter((i) => !i.checked).length

  const { setNodeRef, isOver } = useDroppable({ id: categoryId })

  if (items.length === 0 && !forceVisible) return null

  const itemIds = items.map((item) => item.id)
  const showDropZone = isDragActive && items.length === 0

  return (
    <motion.section layout={!reducedMotion} className="mb-0.5">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="press-scale flex w-full items-center gap-2 rounded-xl px-2 py-2 active:bg-cream-dark/60 dark:active:bg-surface-raised"
      >
        <span className="shrink-0 text-base">{getCategoryEmoji(categoryId)}</span>
        <span className="min-w-0 flex-1 truncate text-left text-meta font-medium text-warm-gray dark:text-warm-gray-light">
          {getCategoryLabel(categoryId)}
        </span>
        <span className="shrink-0 rounded-full bg-cream-dark px-2 py-0.5 text-meta font-medium text-warm-gray dark:bg-surface-raised dark:text-warm-gray-light">
          {unchecked > 0 ? unchecked : items.length}
        </span>
        <motion.svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          animate={{ rotate: open ? 180 : 0 }}
          transition={spring}
          className="shrink-0 text-warm-gray-light"
        >
          <path d="M4 6l4 4 4-4" />
        </motion.svg>
      </button>

      <AnimatePresence initial={false}>
        {(open || showDropZone) && (
          <motion.div
            key="content"
            initial={reducedMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reducedMotion ? undefined : { height: 0, opacity: 0 }}
            transition={spring}
            className="overflow-hidden"
          >
            <div
              ref={setNodeRef}
              className={`min-h-0 rounded-xl px-2 pb-0.5 pr-3 transition-colors ${
                isOver
                  ? 'bg-sage/10 ring-1 ring-sage/30 dark:bg-sage/5'
                  : ''
              } ${showDropZone ? 'min-h-10' : ''}`}
            >
              <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
                <AnimatePresence mode="popLayout">
                  {items.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      currentUserName={currentUserName}
                      onToggle={onToggle}
                      onDelete={onDelete}
                      onEdit={onEdit}
                      reorderMode={reorderMode}
                    />
                  ))}
                </AnimatePresence>
              </SortableContext>
              {showDropZone && (
                <p className="px-2 py-3 text-center text-meta text-warm-gray-light">
                  Drop here
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  )
}
