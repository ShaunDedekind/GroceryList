import { useRef, useState } from 'react'
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
import { hapticLight, hapticMedium } from '../lib/haptics'
import { spring, springSnappy } from '../lib/motion'

interface ItemRowProps {
  item: GroceryItem
  currentUserName: string
  onToggle: (id: string, checked: boolean) => void
  onDelete: (id: string) => void
}

const DELETE_THRESHOLD = -72
const LONG_PRESS_MS = 500

export function ItemRow({ item, currentUserName, onToggle, onDelete }: ItemRowProps) {
  const reducedMotion = useReducedMotion()
  const x = useMotionValue(0)
  const deleteOpacity = useTransform(x, [-72, -24, 0], [1, 0.4, 0])
  const [showDeleteHint, setShowDeleteHint] = useState(false)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isTouch = typeof window !== 'undefined' && 'ontouchstart' in window

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
      layout={!reducedMotion}
      initial={reducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={
        reducedMotion
          ? { opacity: 0 }
          : { opacity: 0, x: -48, transition: { duration: 0.2 } }
      }
      transition={spring}
      className="group relative overflow-hidden rounded-xl"
    >
      <motion.div
        style={{ opacity: deleteOpacity }}
        className="absolute inset-y-0 right-0 flex w-20 items-center justify-center bg-red-500 text-sm font-semibold text-white"
        aria-hidden="true"
      >
        Delete
      </motion.div>

      <motion.div
        drag={isTouch ? 'x' : false}
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
        className="relative flex items-center gap-3 bg-cream py-2.5 dark:bg-[#141c27]"
      >
        <motion.button
          type="button"
          onClick={handleToggle}
          whileTap={reducedMotion ? undefined : { scale: 0.85 }}
          transition={springSnappy}
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
            item.checked
              ? 'border-sage bg-sage text-white'
              : 'border-warm-gray-light/50 active:border-sage'
          }`}
          aria-label={item.checked ? 'Uncheck item' : 'Check item'}
        >
          <AnimatePresence mode="wait">
            {item.checked && (
              <motion.svg
                key="check"
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                initial={reducedMotion ? false : { scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={springSnappy}
              >
                <path d="M2.5 7l3 3 6-6" />
              </motion.svg>
            )}
          </AnimatePresence>
        </motion.button>

        <p
          className={`min-w-0 flex-1 text-base leading-snug transition-all ${
            item.checked
              ? 'text-warm-gray-light line-through dark:text-warm-gray'
              : 'text-[#1e293b] dark:text-[#e2e8f0]'
          }`}
        >
          {item.text}
        </p>

        <UserBadge
          name={item.added_by}
          isCurrentUser={item.added_by === currentUserName}
        />

        {!isTouch && (
          <button
            type="button"
            onClick={handleDelete}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-warm-gray-light transition-opacity active:bg-red-50 active:text-red-500 dark:active:bg-red-950/30 ${
              showDeleteHint
                ? 'opacity-100 text-red-500'
                : 'opacity-0 group-hover:opacity-70 hover:!opacity-100'
            }`}
            aria-label="Delete item"
          >
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4.5 4.5l9 9M13.5 4.5l-9 9" />
            </svg>
          </button>
        )}
      </motion.div>

      {showDeleteHint && !isTouch && (
        <div className="absolute inset-x-0 -bottom-8 z-10 flex justify-end px-2">
          <button
            type="button"
            onClick={() => {
              setShowDeleteHint(false)
              handleDelete()
            }}
            className="press-scale rounded-lg bg-red-500 px-3 py-1 text-xs font-medium text-white shadow-md"
          >
            Delete item
          </button>
        </div>
      )}
    </motion.div>
  )
}
