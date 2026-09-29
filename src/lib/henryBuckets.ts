import type { GroceryItem } from '../types'

export type HenryBucketId =
  | 'overdue'
  | 'today'
  | 'this_week'
  | 'later'
  | 'someday'

export interface HenryBucket {
  id: HenryBucketId
  label: string
  items: GroceryItem[]
}

const BUCKET_ORDER: HenryBucketId[] = [
  'overdue',
  'today',
  'this_week',
  'later',
  'someday',
]

const BUCKET_LABELS: Record<HenryBucketId, string> = {
  overdue: 'Overdue',
  today: 'Today',
  this_week: 'This week',
  later: 'Later',
  someday: 'Someday',
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export function getHenryBucketId(
  dueAt: string | null | undefined,
  now: Date = new Date(),
): HenryBucketId {
  if (!dueAt) return 'someday'

  const due = new Date(dueAt)
  if (Number.isNaN(due.getTime())) return 'someday'

  const today = startOfDay(now)
  const dueDay = startOfDay(due)
  const weekEnd = addDays(today, 7)

  if (dueDay < today) return 'overdue'
  if (dueDay.getTime() === today.getTime()) return 'today'
  if (dueDay < weekEnd) return 'this_week'
  return 'later'
}

export function groupHenryItems(
  items: GroceryItem[],
  options: { showDone?: boolean; now?: Date } = {},
): HenryBucket[] {
  const { showDone = false, now = new Date() } = options
  const visible = showDone ? items : items.filter((item) => !item.checked)

  const buckets = new Map<HenryBucketId, GroceryItem[]>(
    BUCKET_ORDER.map((id) => [id, []]),
  )

  for (const item of visible) {
    const bucketId = getHenryBucketId(item.due_at, now)
    buckets.get(bucketId)!.push(item)
  }

  for (const list of buckets.values()) {
    list.sort((a, b) => {
      if (a.checked !== b.checked) return a.checked ? 1 : -1
      const aDue = a.due_at ? Date.parse(a.due_at) : Number.POSITIVE_INFINITY
      const bDue = b.due_at ? Date.parse(b.due_at) : Number.POSITIVE_INFINITY
      if (aDue !== bDue) return aDue - bDue
      return a.sort_order - b.sort_order
    })
  }

  return BUCKET_ORDER.map((id) => ({
    id,
    label: BUCKET_LABELS[id],
    items: buckets.get(id) ?? [],
  })).filter((bucket) => bucket.items.length > 0)
}

export function formatDueLabel(
  dueAt: string | null | undefined,
  now: Date = new Date(),
): string {
  if (!dueAt) return 'Someday'
  const due = new Date(dueAt)
  if (Number.isNaN(due.getTime())) return 'Someday'

  const today = startOfDay(now)
  const dueDay = startOfDay(due)
  const hasTime =
    due.getHours() !== 0 || due.getMinutes() !== 0 || due.getSeconds() !== 0

  const time = hasTime
    ? due.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      })
    : null

  const dayDiff = Math.round(
    (dueDay.getTime() - today.getTime()) / (24 * 60 * 60 * 1000),
  )

  let dayLabel: string
  if (dayDiff === 0) dayLabel = 'Today'
  else if (dayDiff === 1) dayLabel = 'Tomorrow'
  else if (dayDiff === -1) dayLabel = 'Yesterday'
  else {
    dayLabel = due.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  return time ? `${dayLabel} ${time}` : dayLabel
}
