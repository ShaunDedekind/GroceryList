import type { GroceryItem } from '../types'

export type NowBucketId =
  | 'overdue'
  | 'today'
  | 'this_week'
  | 'coming_up'
  | 'someday'

export interface NowBucket {
  id: NowBucketId
  label: string
  items: GroceryItem[]
  /** Someday starts collapsed in the Now view. */
  defaultCollapsed?: boolean
}

const BUCKET_ORDER: NowBucketId[] = [
  'overdue',
  'today',
  'this_week',
  'coming_up',
  'someday',
]

const BUCKET_LABELS: Record<NowBucketId, string> = {
  overdue: 'Overdue',
  today: 'Today',
  this_week: 'This week',
  coming_up: 'Coming up',
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

export function getNowBucketId(
  dueAt: string | null | undefined,
  now: Date = new Date(),
): NowBucketId {
  if (!dueAt) return 'someday'

  const due = new Date(dueAt)
  if (Number.isNaN(due.getTime())) return 'someday'

  const today = startOfDay(now)
  const dueDay = startOfDay(due)
  const weekEnd = addDays(today, 7)

  if (dueDay < today) return 'overdue'
  if (dueDay.getTime() === today.getTime()) return 'today'
  if (dueDay < weekEnd) return 'this_week'
  return 'coming_up'
}

/** @deprecated Use getNowBucketId — kept for Henry tests during migration. */
export function getHenryBucketId(
  dueAt: string | null | undefined,
  now: Date = new Date(),
): NowBucketId {
  return getNowBucketId(dueAt, now)
}

export function groupNowItems(
  items: GroceryItem[],
  options: { showDone?: boolean; now?: Date } = {},
): NowBucket[] {
  const { showDone = false, now = new Date() } = options
  const visible = showDone ? items : items.filter((item) => !item.checked)

  const buckets = new Map<NowBucketId, GroceryItem[]>(
    BUCKET_ORDER.map((id) => [id, []]),
  )

  for (const item of visible) {
    const bucketId = getNowBucketId(item.due_at, now)
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
    defaultCollapsed: id === 'someday',
  })).filter((bucket) => bucket.items.length > 0)
}

/** Alias for callers still importing Henry helpers. */
export const groupHenryItems = groupNowItems

export function formatDueLabel(
  dueAt: string | null | undefined,
  now: Date = new Date(),
  options: { omitSomeday?: boolean } = {},
): string | null {
  if (!dueAt) return options.omitSomeday ? null : 'Someday'
  const due = new Date(dueAt)
  if (Number.isNaN(due.getTime())) {
    return options.omitSomeday ? null : 'Someday'
  }

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

export function buildNowSummary(items: GroceryItem[], now: Date = new Date()): string {
  const open = items.filter((i) => !i.checked)
  const billsDue = open.filter((i) => {
    if (i.item_kind !== 'bill' && i.category !== 'bills') return false
    const bucket = getNowBucketId(i.due_at, now)
    return bucket === 'overdue' || bucket === 'today' || bucket === 'this_week'
  }).length

  const overdue = open.filter((i) => getNowBucketId(i.due_at, now) === 'overdue').length
  const today = open.filter((i) => getNowBucketId(i.due_at, now) === 'today').length
  const thisWeek = open.filter((i) => getNowBucketId(i.due_at, now) === 'this_week')

  const parts: string[] = []
  if (billsDue > 0) {
    parts.push(`${billsDue} bill${billsDue === 1 ? '' : 's'} due this week`)
  } else if (overdue > 0) {
    parts.push(`${overdue} overdue`)
  } else if (today > 0) {
    parts.push(`${today} today`)
  }

  const nextSession = thisWeek.find(
    (i) => i.item_kind === 'session' || i.category === 'activities',
  )
  if (nextSession) {
    const when = formatDueLabel(nextSession.due_at, now, { omitSomeday: true })
    parts.push(
      when
        ? `${nextSession.text.replace(/\s+/g, ' ').slice(0, 40)}${when !== 'Today' ? ` ${when}` : ' today'}`
        : nextSession.text.slice(0, 40),
    )
  }

  if (parts.length === 0) {
    if (open.length === 0) return 'All clear'
    return `${open.length} open`
  }
  return parts.slice(0, 2).join(' · ')
}
