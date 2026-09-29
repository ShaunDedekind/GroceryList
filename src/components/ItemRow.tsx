import { useEffect, useRef, useState, type HTMLAttributes } from 'react'
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
import { parseItemDisplay } from '../lib/itemNote'
import { UserBadge } from './UserBadge'
import { Icon } from './Icon'
import { HapticSwitch } from './HapticSwitch'
import { hapticLight, hapticMedium } from '../lib/haptics'
import { spring, springSnappy } from '../lib/motion'

interface ItemRowProps {
  item: GroceryItem
  currentUserName: string
  onToggle: (id: string, checked: boolean) => void
  onDelete: (id: string) => void
  onEdit: (item: GroceryItem) => void
  reorderMode?: boolean
  isDragOverlay?: boolean
  showSeparator?: boolean
  dueLabel?: string | null
  typeChip?: { emoji: string; label: string } | null
}

const LONG_PRESS_MS = 500

function DragHandle(props: HTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={`hit-touch touch-none text-warm-gray-light active:bg-cream-dark/80 dark:active:bg-surface ${props.className ?? ''}`}
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
  isDragOverlay = false,
  showSeparator = true,
  dueLabel = null,
  typeChip = null,
}: ItemRowProps) {
  const reducedMotion = useReducedMotion()
  const rowRef = useRef<HTMLDivElement | null>(null)
  const [rowWidth, setRowWidth] = useState(360)
  const x = useMotionValue(0)
  const revealWidth = useTransform(x, (latest) => Math.max(0, Math.min(-latest, rowWidth)))
  const [showDeleteHint, setShowDeleteHint] = useState(false)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isTouch = typeof window !== 'undefined' && 'ontouchstart' in window
  const { title, note } = parseItemDisplay(item.text)

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

  const sortableStyle = transform
    ? {
        transform: CSS.Transform.toString(transform),
        transition,
      }
    : undefined

  useEffect(() => {
    const node = rowRef.current
    if (!node) return
    const observer = new ResizeObserver(() => {
      setRowWidth(node.offsetWidth)
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const handleToggle = (checked: boolean) => {
    hapticLight()
    onToggle(item.id, checked)
  }

  const handleDelete = () => {
    hapticMedium()
    onDelete(item.id)
  }

  const startLongPress = () => {
    if (isTouch) return
    longPressTimer.current = setTimeout(() => {
      setShowDeleteHint(true)
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
      initial={reducedMotion ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: isDragging ? 0.35 : 1, y: 0 }}
      exit={
        reducedMotion
          ? { opacity: 0, transition: { duration: 0 } }
          : { height: 0, opacity: 0, transition: { duration: 0.28 } }
      }
      transition={spring}
      className="group relative overflow-hidden"
    >
      <div ref={rowRef} className="relative overflow-hidden">
        <motion.div
          style={{ width: revealWidth }}
          className="absolute inset-y-0 right-0 flex items-center justify-end overflow-hidden bg-error text-footnote font-semibold text-white"
          aria-hidden="true"
        >
          <span className="px-4">Delete</span>
        </motion.div>

        <motion.div
          drag={isTouch && !isDragging ? 'x' : false}
          dragDirectionLock
          dragConstraints={{ left: -rowWidth, right: 0 }}
          dragElastic={{ left: 0.05, right: 0 }}
          dragMomentum={false}
          style={{ x: isTouch ? x : 0 }}
          onDragEnd={(_, info) => {
            const width = rowRef.current?.offsetWidth || rowWidth
            const pastThreshold = -info.offset.x > width * 0.4
            const flicked = info.velocity.x < -500
            if (pastThreshold || flicked) {
              handleDelete()
            } else {
              animate(x, 0, reducedMotion ? { duration: 0 } : springSnappy)
            }
          }}
          onPointerDown={startLongPress}
          onPointerUp={cancelLongPress}
          onPointerLeave={cancelLongPress}
          className="relative flex min-h-row items-stretch"
        >
          <div className="flex shrink-0 items-center">
            {reorderMode && !isDragOverlay && (
              <DragHandle {...attributes} {...listeners} />
            )}

            <div className="hit-touch relative shrink-0">
              <span
                className={`item-check flex items-center justify-center ${
                  item.checked ? 'item-check-checked' : ''
                }`}
                aria-hidden="true"
              >
                <AnimatePresence mode="wait">
                  {item.checked && (
                    <motion.span
                      key="check"
                      initial={reducedMotion ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={springSnappy}
                    >
                      <Icon name="check" size="sm" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
              <HapticSwitch
                checked={item.checked}
                label={item.checked ? 'Uncheck item' : 'Check item'}
                onChange={handleToggle}
              />
            </div>
          </div>

          <div
            className={`flex min-w-0 flex-1 items-center gap-2 pr-3 ${
              showSeparator ? 'border-b border-separator' : ''
            }`}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(item)
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="min-w-0 flex-1 py-1.5 text-left active:opacity-70"
            >
              <span
                className={`block truncate text-row-title ${
                  item.checked
                    ? 'text-warm-gray-light line-through dark:text-warm-gray'
                    : 'text-ink dark:text-ink-dark'
                }`}
              >
                {title}
              </span>
              {(note || dueLabel || typeChip) && (
                <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-meta text-warm-gray dark:text-warm-gray-light">
                  {typeChip && (
                    <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-cream-dark px-1.5 py-0.5 font-medium text-ink dark:bg-surface dark:text-ink-dark">
                      <span aria-hidden="true">{typeChip.emoji}</span>
                      {typeChip.label}
                    </span>
                  )}
                  {dueLabel && <span className="shrink-0">{dueLabel}</span>}
                  {note && <span className="min-w-0 truncate">{note}</span>}
                </span>
              )}
            </button>

            <UserBadge
              name={item.added_by}
              isCurrentUser={item.added_by === currentUserName}
            />

            {!isTouch && (
              <button
                type="button"
                onClick={handleDelete}
                className={`hit-touch text-warm-gray-light transition-opacity active:bg-error-banner ${
                  showDeleteHint
                    ? 'opacity-100 text-error'
                    : 'opacity-0 group-hover:opacity-70 hover:!opacity-100'
                }`}
                aria-label="Delete item"
              >
                <Icon name="close" size="sm" />
              </button>
            )}
          </div>
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
