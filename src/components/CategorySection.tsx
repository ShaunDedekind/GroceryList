import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import type { GroceryItem } from '../types'
import { ItemRow } from './ItemRow'
import { Icon } from './Icon'
import { spring } from '../lib/motion'

const TINTS = ['tint-blush', 'tint-sky', 'tint-sunshine'] as const

function tintForCategory(id: string): (typeof TINTS)[number] {
  let sum = 0
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i)
  return TINTS[sum % TINTS.length]
}

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
  defaultOpen?: boolean
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
  defaultOpen = true,
}: CategorySectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  const reducedMotion = useReducedMotion()
  const unchecked = items.filter((i) => !i.checked).length

  const { setNodeRef, isOver } = useDroppable({ id: categoryId })

  if (items.length === 0 && !forceVisible) return null

  const itemIds = items.map((item) => item.id)
  const showDropZone = isDragActive && items.length === 0
  const tint = tintForCategory(categoryId)

  return (
    <motion.section layout={!reducedMotion ? 'position' : false} className="mb-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="press-scale flex min-h-11 w-full items-center gap-2 px-1 py-1 active:opacity-70"
      >
        <span className="shrink-0 text-sm">{categoryEmoji}</span>
        <span className="min-w-0 flex-1 truncate text-left text-footnote font-semibold text-ink dark:text-ink-dark">
          {categoryLabel}
        </span>
        <span className="shrink-0 rounded-full bg-cream-dark px-2 py-0.5 text-meta font-semibold text-ink dark:bg-surface-raised dark:text-ink-dark">
          {unchecked > 0 ? unchecked : items.length}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={spring}
          className="shrink-0 text-warm-gray-light"
        >
          <Icon name="chevronDown" size="sm" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {(open || showDropZone) && (
          <motion.div
            key="content"
            initial={reducedMotion ? false : { scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            exit={reducedMotion ? undefined : { scaleY: 0, opacity: 0 }}
            transition={spring}
            style={{ transformOrigin: 'top' }}
            className="overflow-hidden"
          >
            <div
              ref={setNodeRef}
              className={`surface-card overflow-hidden ${tint} ${
                isOver ? 'ring-1 ring-sage/30' : ''
              } ${showDropZone ? 'min-h-10' : ''}`}
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
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  )
}
