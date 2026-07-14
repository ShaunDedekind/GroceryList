import { useEffect, useState, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { motion, useReducedMotion } from 'motion/react'
import { getCategoryEmoji } from '../constants/categories'
import type { RecentItem } from '../lib/recentItems'
import { springSnappy } from '../lib/motion'

const MAX_RECENT_IN_MENU = 6
const MENU_GAP = 8
const SAFE_EDGE_MARGIN = 12

function getSafeAreaInset(side: 'top' | 'bottom' | 'left' | 'right'): number {
  if (typeof document === 'undefined') return 0
  const probe = document.createElement('div')
  probe.style.position = 'fixed'
  probe.style.visibility = 'hidden'
  probe.style.pointerEvents = 'none'
  if (side === 'top') probe.style.paddingTop = 'env(safe-area-inset-top)'
  if (side === 'bottom') probe.style.paddingBottom = 'env(safe-area-inset-bottom)'
  if (side === 'left') probe.style.paddingLeft = 'env(safe-area-inset-left)'
  if (side === 'right') probe.style.paddingRight = 'env(safe-area-inset-right)'
  document.body.appendChild(probe)
  const style = getComputedStyle(probe)
  const value = parseFloat(
    side === 'top'
      ? style.paddingTop
      : side === 'bottom'
        ? style.paddingBottom
        : side === 'left'
          ? style.paddingLeft
          : style.paddingRight,
  )
  document.body.removeChild(probe)
  return Number.isFinite(value) ? value : 0
}

function getLayoutViewportHeight(): number {
  const vv = window.visualViewport
  if (!vv) return window.innerHeight

  let offsetTop = vv.offsetTop
  const keyboardLikelyClosed = vv.height >= window.innerHeight * 0.92
  if (keyboardLikelyClosed && offsetTop > 0) {
    offsetTop = 0
  }

  return vv.height + offsetTop
}

interface ListActionMenuProps {
  open: boolean
  reorderMode: boolean
  shopMode: boolean
  anchorRef: RefObject<HTMLButtonElement | null>
  recentItems: RecentItem[]
  onClose: () => void
  onPaste: () => void
  onShare: () => void
  onStartReorder: () => void
  onToggleShopMode: () => void
  onRecentAdd: (item: RecentItem) => void
}

function MenuItem({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className="press-scale flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-body text-ink active:bg-cream-dark/60 disabled:opacity-40 dark:text-ink-dark dark:active:bg-surface"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cream-dark/80 text-sage dark:bg-surface dark:text-sage-light">
        {icon}
      </span>
      <span className="font-medium">{label}</span>
    </button>
  )
}

function RecentMenuItem({
  item,
  onClick,
}: {
  item: RecentItem
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="press-scale flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-body text-ink active:bg-cream-dark/60 dark:text-ink-dark dark:active:bg-surface"
    >
      <span className="shrink-0 text-base">{getCategoryEmoji(item.category)}</span>
      <span className="min-w-0 truncate font-medium">{item.text}</span>
    </button>
  )
}

function useMenuPosition(
  open: boolean,
  anchorRef: RefObject<HTMLButtonElement | null>,
) {
  const [position, setPosition] = useState({ bottom: 0, right: 0 })

  useEffect(() => {
    if (!open) return

    const update = () => {
      const rect = anchorRef.current?.getBoundingClientRect()
      if (!rect) return

      const layoutHeight = getLayoutViewportHeight()
      const safeBottom = Math.max(SAFE_EDGE_MARGIN, getSafeAreaInset('bottom'))
      const safeRight = Math.max(SAFE_EDGE_MARGIN, getSafeAreaInset('right'))

      setPosition({
        bottom: Math.max(layoutHeight - rect.top + MENU_GAP, safeBottom),
        right: Math.max(window.innerWidth - rect.right, safeRight),
      })
    }

    update()
    const vv = window.visualViewport
    if (vv) {
      vv.addEventListener('resize', update)
      vv.addEventListener('scroll', update)
    }
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    return () => {
      if (vv) {
        vv.removeEventListener('resize', update)
        vv.removeEventListener('scroll', update)
      }
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [open, anchorRef])

  return position
}

export function ListActionMenu({
  open,
  reorderMode,
  shopMode,
  anchorRef,
  recentItems,
  onClose,
  onPaste,
  onShare,
  onStartReorder,
  onToggleShopMode,
  onRecentAdd,
}: ListActionMenuProps) {
  const reducedMotion = useReducedMotion()
  const position = useMenuPosition(open, anchorRef)
  const visibleRecents = recentItems.slice(0, MAX_RECENT_IN_MENU)

  if (!open) return null

  const handlePaste = () => {
    onClose()
    onPaste()
  }

  const handleShare = () => {
    onClose()
    onShare()
  }

  const handleReorder = () => {
    onClose()
    onStartReorder()
  }

  const handleShopMode = () => {
    onClose()
    onToggleShopMode()
  }

  const handleRecentAdd = (item: RecentItem) => {
    onClose()
    onRecentAdd(item)
  }

  return createPortal(
    <>
      <div
        className="viewport-overlay z-50 bg-black/20"
        onClick={onClose}
        aria-hidden="true"
      />
      <motion.div
        role="menu"
        aria-label="List actions"
        initial={reducedMotion ? false : { opacity: 0, y: 8, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={springSnappy}
        className="fixed z-50 min-w-[14rem] w-56 overflow-hidden rounded-2xl border border-cream-dark bg-white py-1.5 shadow-lg dark:border-border-dark dark:bg-surface-raised"
        style={{
          bottom: position.bottom,
          right: position.right,
        }}
      >
        <MenuItem
          label="Paste items"
          onClick={handlePaste}
          icon={
            <svg width="18" height="18" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="7" y="4" width="12" height="14" rx="2" />
              <path d="M5 7H4a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-1" />
            </svg>
          }
        />
        <MenuItem
          label="Share list"
          onClick={handleShare}
          icon={
            <svg width="18" height="18" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="16" cy="5" r="2.5" />
              <circle cx="6" cy="11" r="2.5" />
              <circle cx="16" cy="17" r="2.5" />
              <path d="M8.2 9.7l5.6-3.2M8.2 12.3l5.6 3.2" />
            </svg>
          }
        />
        <MenuItem
          label={shopMode ? 'Planning mode' : 'Shop mode'}
          onClick={handleShopMode}
          icon={
            <svg width="18" height="18" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 7h12l-1.5 9H7.5L6 7z" />
              <path d="M9 7V5a2 2 0 012-2h0a2 2 0 012 2v2" />
            </svg>
          }
        />
        <MenuItem
          label="Reorder"
          onClick={handleReorder}
          disabled={reorderMode || shopMode}
          icon={
            <svg width="18" height="18" viewBox="0 0 10 14" fill="currentColor">
              <circle cx="2.5" cy="2.5" r="1.2" />
              <circle cx="7.5" cy="2.5" r="1.2" />
              <circle cx="2.5" cy="7" r="1.2" />
              <circle cx="7.5" cy="7" r="1.2" />
              <circle cx="2.5" cy="11.5" r="1.2" />
              <circle cx="7.5" cy="11.5" r="1.2" />
            </svg>
          }
        />

        {visibleRecents.length > 0 && (
          <>
            <div className="mx-3 my-1 border-t border-cream-dark dark:border-border-dark" />
            <p className="px-3 pb-0.5 pt-1 text-meta font-semibold uppercase tracking-wide text-warm-gray-light">
              Recent
            </p>
            {visibleRecents.map((item) => (
              <RecentMenuItem
                key={`${item.text}-${item.category}`}
                item={item}
                onClick={() => handleRecentAdd(item)}
              />
            ))}
          </>
        )}
      </motion.div>
    </>,
    document.body,
  )
}
