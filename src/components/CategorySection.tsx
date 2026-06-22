import { useState } from 'react'
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
  defaultOpen?: boolean
}

export function CategorySection({
  categoryId,
  items,
  currentUserName,
  onToggle,
  onDelete,
  onEdit,
  defaultOpen = true,
}: CategorySectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  const reducedMotion = useReducedMotion()
  const unchecked = items.filter((i) => !i.checked).length

  if (items.length === 0) return null

  return (
    <motion.section layout={!reducedMotion} className="mb-1">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="press-scale flex w-full items-center gap-2 rounded-xl px-2 py-2.5 active:bg-cream-dark/60 dark:active:bg-[#1e2a3a]"
      >
        <span className="text-lg">{getCategoryEmoji(categoryId)}</span>
        <span className="flex-1 text-left text-sm font-semibold uppercase tracking-wide text-warm-gray dark:text-warm-gray-light">
          {getCategoryLabel(categoryId)}
        </span>
        <span className="rounded-full bg-cream-dark px-2 py-0.5 text-xs font-medium text-warm-gray dark:bg-[#1e2a3a] dark:text-warm-gray-light">
          {unchecked > 0 ? unchecked : items.length}
        </span>
        <motion.svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          animate={{ rotate: open ? 180 : 0 }}
          transition={spring}
          className="text-warm-gray-light"
        >
          <path d="M4 6l4 4 4-4" />
        </motion.svg>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={reducedMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reducedMotion ? undefined : { height: 0, opacity: 0 }}
            transition={spring}
            className="overflow-hidden px-2 pb-1"
          >
            <AnimatePresence mode="popLayout">
              {items.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  currentUserName={currentUserName}
                  onToggle={onToggle}
                  onDelete={onDelete}
                  onEdit={onEdit}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  )
}
