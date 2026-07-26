import { useRef, useState, type HTMLAttributes } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useMotionValue,
  useTransform,
  animate,
} from 'motion/react'
import type { GroceryItem } from '../types'
import { UserBadge } from './UserBadge'
import { Icon } from './Icon'
import { hapticLight, hapticMedium } from '../lib/haptics'
import { spring, springSnappy } from '../lib/motion'

interface ItemRowProps {
  item: GroceryItem
  currentUserName: string
  onToggle: (id: string, checked: boolean) => void
  onDelete: (id: string) => void
  onEdit: (item: GroceryItem) => void
  reorderMode?: boolean
  shopMode?: boolean
  isDragOverlay?: boolean
  card?: boolean
  showSeparator?: boolean
}

const DELETE_THRESHOLD = -72
const LONG_PRESS_MS = 500

function DragHandle(props: HTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={`flex h-9 w-7 shrink-0 touch-none items-center justify-center rounded-[var(--radius-sm)] text-warm-gray-light active:bg-cream-dark/80 dark:active:bg-surface ${props.className ?? ''}`}
      aria-label="Reorder item"
    >
      <Icon name="reorder" size="sm" />
    </button>
  )
}

export function ItemRow({
  item,
  currentUserName,
  onToggle,
  onDelete,
  onEdit,
  reorderMode = false,
  shopMode = false,
  isDragOverlay = false,
  card = false,
  showSeparator = true,
}: ItemRowProps) {
  const reducedMotion = useReducedMotion()
  const x = useMotionValue(0)
  const deleteOpacity = useTransform(x, [-72, -24, 0], [1, 0.4, 0])
  const [showDeleteHint, setShowDeleteHint] = useState(false)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isTouch = typeof window !== 'undefined' && 'ontouchstart' in window

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    disabled: !reorderMode || isDragOverlay,
  })

  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  }

  const handleToggle = () => {
    hapticLight()
    onToggle(item.id, !item.checked)
  }

  const handleDelete = () => {
    hapticMedium()
    onDelete(item.id)
  }

  const startLongPress = () => {
    if (isTouch) return
    longPressTimer.current = setTimeout(() => {
      setShowDeleteHint(true)
      hapticLight()
    }, LONG_PRESS_MS)
  }

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={sortableStyle}
      layout={!reducedMotion && !isDragging ? 'position' : false}
      initial={reducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: isDragging ? 0.35 : 1, y: 0 }}
      exit={
        reducedMotion
          ? { opacity: 0 }
          : { opacity: 0, x: -48, transition: { duration: 0.2 } }
      }
      transition={spring}
      className={`group relative ${card ? 'surface-card overflow-hidden' : ''}`}
    >
      <div className="relative overflow-hidden">
        <motion.div
          style={{ opacity: deleteOpacity }}
          className="absolute inset-y-0 right-0 flex w-20 items-center justify-center bg-error text-sm font-semibold text-white"
          aria-hidden="true"
        >
          Delete
        </motion.div>

        <motion.div
          drag={isTouch && !isDragging ? 'x' : false}
          dragConstraints={{ left: -80, right: 0 }}
          dragElastic={0.08}
          style={{ x: isTouch ? x : 0 }}
          onDragEnd={(_, info) => {
            if (info.offset.x < DELETE_THRESHOLD) {
              handleDelete()
            } else {
              animate(x, 0, springSnappy)
            }
          }}
          onPointerDown={startLongPress}
          onPointerUp={cancelLongPress}
          onPointerLeave={cancelLongPress}
          className={`relative flex min-h-row items-center gap-2.5 py-[var(--spacing-row-y)] pr-1 ${
            reorderMode ? 'pl-1' : 'pl-[var(--spacing-row-x)]'
          } ${
            !card && showSeparator ? 'border-b border-separator' : ''
          }`}
        >
          {reorderMode && !isDragOverlay && (
            <DragHandle {...attributes} {...listeners} />
          )}

          <motion.button
            type="button"
            onClick={handleToggle}
            whileTap={reducedMotion ? undefined : { scale: 0.9 }}
            transition={springSnappy}
            className="hit-touch -my-1 shrink-0"
            aria-label={item.checked ? 'Uncheck item' : 'Check item'}
          >
            <span
              className={`item-check flex items-center justify-center ${
                item.checked ? 'item-check-checked' : ''
              }`}
            >
              <AnimatePresence mode="wait">
                {item.checked && (
                  <motion.span
                    key="check"
                    initial={reducedMotion ? false : { scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={springSnappy}
                  >
                    <Icon name="check" size="sm" />
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
          </motion.button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(item)
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className={`min-w-0 flex-1 text-left text-row-title leading-tight transition-opacity active:opacity-70 ${
              shopMode ? 'line-clamp-2' : 'truncate'
            } ${
              item.checked
                ? 'text-warm-gray-light line-through dark:text-warm-gray'
                : 'text-ink dark:text-ink-dark'
            }`}
          >
            {item.text}
          </button>

          <UserBadge
            name={item.added_by}
            isCurrentUser={item.added_by === currentUserName}
          />

          {!isTouch && (
            <button
              type="button"
              onClick={handleDelete}
              className={`flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[8px] text-warm-gray-light transition-opacity active:bg-error-banner ${
                showDeleteHint
                  ? 'opacity-100 text-error'
                  : 'opacity-0 group-hover:opacity-70 hover:!opacity-100'
              }`}
              aria-label="Delete item"
            >
              <Icon name="close" size="sm" />
            </button>
          )}
        </motion.div>
      </div>

      {showDeleteHint && !isTouch && (
        <div className="absolute inset-x-0 -bottom-8 z-10 flex justify-end px-2">
          <button
            type="button"
            onClick={() => {
              setShowDeleteHint(false)
              handleDelete()
            }}
            className="press-scale rounded-[var(--radius-md)] bg-error px-3 py-1 text-meta font-medium text-white shadow-md"
          >
            Delete item
          </button>
        </div>
      )}
    </motion.div>
  )
}
