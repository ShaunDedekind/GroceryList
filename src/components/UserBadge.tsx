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
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 ${
        isCurrentUser ? 'ring-sage/60' : 'ring-transparent'
      }`}
      style={{ backgroundColor: color }}
      aria-label={name ? `Added by ${name}` : 'Added by unknown'}
    >
      {initials}
    </span>
  )
}
