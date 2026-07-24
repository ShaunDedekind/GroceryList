import { getAvatarColor, getInitials } from '../lib/initials'

interface UserBadgeProps {
  name: string | null | undefined
  isCurrentUser?: boolean
}

export function UserBadge({ name, isCurrentUser }: UserBadgeProps) {
  const initials = getInitials(name)
  const color = getAvatarColor(name)

  return (
    <span
      title={name ?? undefined}
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ring-1 ring-inset ${
        isCurrentUser
          ? 'ring-sage/60 shadow-[0_0_0_3px_rgba(45,106,79,0.12)]'
          : 'ring-transparent shadow-[0_0_0_3px_rgba(107,101,96,0.08)]'
      }`}
      style={{ backgroundColor: color }}
      aria-label={name ? `Added by ${name}` : 'Added by unknown'}
    >
      {initials}
    </span>
  )
}
