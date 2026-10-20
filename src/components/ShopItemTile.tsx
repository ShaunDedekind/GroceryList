import { useEffect, useRef, useState } from 'react'
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from 'motion/react'
import type { GroceryItem } from '../types'
import { parseItemDisplay } from '../lib/itemNote'
import { spring, springSnappy } from '../lib/motion'
import { hapticLight, hapticMedium } from '../lib/haptics'
import { HapticSwitch } from './HapticSwitch'
import { Icon } from './Icon'
import { UserBadge } from './UserBadge'

interface ShopItemTileProps {
  item: GroceryItem
  currentUserName: string
  onToggle: (id: string, checked: boolean) => void
  onDelete: (id: string) => void
  onEdit: (item: GroceryItem) => void
}

export function ShopItemTile({
  item,
  currentUserName,
  onToggle,
  onDelete,
  onEdit,
}: ShopItemTileProps) {
  const reducedMotion = useReducedMotion()
  const tileRef = useRef<HTMLDivElement | null>(null)
  const [tileWidth, setTileWidth] = useState(160)
  const x = useMotionValue(0)
  const revealWidth = useTransform(x, (latest) =>
    Math.max(0, Math.min(-latest, tileWidth)),
  )
  const isTouch = typeof window !== 'undefined' && 'ontouchstart' in window
  const { title, note } = parseItemDisplay(item.text)
  const showDoneFace = item.checked

  useEffect(() => {
    const node = tileRef.current
    if (!node) return
    const observer = new ResizeObserver(() => {
      setTileWidth(node.offsetWidth)
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

  return (
    <motion.div
      layout={!reducedMotion ? 'position' : false}
      initial={reducedMotion ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={
        reducedMotion
          ? { opacity: 0, transition: { duration: 0 } }
          : { opacity: 0, height: 0, transition: { duration: 0.28 } }
      }
      transition={spring}
      className="relative min-h-[5.5rem] overflow-hidden rounded-[var(--radius-md)]"
    >
      <div ref={tileRef} className="relative h-full overflow-hidden">
        <motion.div
          style={{ width: revealWidth }}
          className="absolute inset-y-0 right-0 z-10 flex items-center justify-end overflow-hidden bg-error text-caption font-semibold text-white"
          aria-hidden="true"
        >
          <span className="px-3">Delete</span>
        </motion.div>

        <motion.div
          drag={isTouch ? 'x' : false}
          dragDirectionLock
          dragConstraints={{ left: -tileWidth, right: 0 }}
          dragElastic={{ left: 0.05, right: 0 }}
          dragMomentum={false}
          style={{ x: isTouch ? x : 0 }}
          onDragEnd={(_, info) => {
            const width = tileRef.current?.offsetWidth || tileWidth
            const pastThreshold = -info.offset.x > width * 0.4
            const flicked = info.velocity.x < -500
            if (pastThreshold || flicked) {
              handleDelete()
            } else {
              animate(x, 0, reducedMotion ? { duration: 0 } : springSnappy)
            }
          }}
          className="relative h-full min-h-[5.5rem]"
        >
          <div className="relative h-full min-h-[5.5rem] [perspective:800px]">
            <motion.div
              className="relative h-full min-h-[5.5rem] [transform-style:preserve-3d]"
              animate={{
                rotateY: showDoneFace && !reducedMotion ? 180 : 0,
              }}
              transition={
                reducedMotion
                  ? { duration: 0 }
                  : { type: 'spring', stiffness: 280, damping: 26 }
              }
            >
              <div
                className={`absolute inset-0 flex flex-col rounded-[var(--radius-md)] bg-cream p-2.5 [backface-visibility:hidden] dark:bg-surface-raised ${
                  showDoneFace && reducedMotion ? 'opacity-0' : 'opacity-100'
                }`}
              >
                <div className="flex min-w-0 items-start gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit(item)
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="min-w-0 flex-1 text-left active:opacity-70"
                  >
                    <span className="line-clamp-2 block text-row-title leading-snug text-ink dark:text-ink-dark">
                      {title}
                    </span>
                    {note && (
                      <span className="mt-0.5 block truncate text-meta text-warm-gray dark:text-warm-gray-light">
                        {note}
                      </span>
                    )}
                  </button>
                  <UserBadge
                    name={item.added_by}
                    isCurrentUser={item.added_by === currentUserName}
                  />
                </div>

                <div className="mt-auto flex justify-end pt-1">
                  <div className="hit-touch relative shrink-0">
                    <span
                      className="item-check flex items-center justify-center"
                      aria-hidden="true"
                    />
                    <HapticSwitch
                      checked={item.checked}
                      label={item.checked ? 'Uncheck item' : 'Check item'}
                      onChange={handleToggle}
                    />
                  </div>
                </div>
              </div>

              <div
                className={`absolute inset-0 flex flex-col items-center justify-center rounded-[var(--radius-md)] bg-sage/15 p-2.5 [backface-visibility:hidden] [transform:rotateY(180deg)] dark:bg-sage/20 ${
                  showDoneFace
                    ? 'pointer-events-auto opacity-100'
                    : 'pointer-events-none opacity-0'
                } ${showDoneFace && reducedMotion ? '[transform:none]' : ''}`}
              >
                <span className="item-check item-check-checked flex items-center justify-center">
                  <Icon name="check" size="sm" />
                </span>
                <p className="mt-2 text-meta font-semibold text-sage dark:text-sage-light">
                  Done
                </p>
                <div className="absolute inset-x-0 bottom-1 flex justify-center">
                  <div className="hit-touch relative">
                    <HapticSwitch
                      checked={item.checked}
                      label="Uncheck item"
                      onChange={handleToggle}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
