import { getAvatarColor } from '../lib/initials'

interface UserBadgeProps {
  name: string | null | undefined
  isCurrentUser?: boolean
}

export function UserBadge({ name, isCurrentUser }: UserBadgeProps) {
  if (isCurrentUser || !name) return null

  const color = getAvatarColor(name)

  return (
    <span
      title={name}
      className="h-4 w-4 shrink-0 rounded-full"
      style={{ backgroundColor: color }}
      aria-label={`Added by ${name}`}
    />
  )
}
