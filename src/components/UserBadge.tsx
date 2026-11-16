import type { ItemOwner } from '../types'
import { ownerLabel, ownerMarker } from '../lib/ownership'

interface UserBadgeProps {
  owner?: ItemOwner | null
  /** @deprecated Prefer owner */
  name?: string | null
  isCurrentUser?: boolean
}

export function UserBadge({ owner }: UserBadgeProps) {
  const value: ItemOwner = owner ?? 'shared'
  if (value === 'shared') {
    return (
      <span
        title={ownerLabel(value)}
        className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-cream-dark px-1 text-[10px] font-semibold tracking-wide text-sage dark:bg-surface dark:text-sage-light"
        aria-label={ownerLabel(value)}
      >
        {ownerMarker(value)}
      </span>
    )
  }

  return (
    <span
      title={ownerLabel(value)}
      className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-sage px-1 text-[10px] font-semibold text-cream dark:bg-sage-light dark:text-sage"
      aria-label={ownerLabel(value)}
    >
      {ownerMarker(value)}
    </span>
  )
}
