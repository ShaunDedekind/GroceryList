import type { RecurrenceRule } from '../types'

export function nextDueAt(
  fromIso: string | null | undefined,
  rule: RecurrenceRule | null | undefined,
  now: Date = new Date(),
): string | null {
  if (!rule) return null
  const base = fromIso ? new Date(fromIso) : now
  if (Number.isNaN(base.getTime())) return null

  const interval = Math.max(1, rule.interval ?? 1)
  const next = new Date(base)

  switch (rule.freq) {
    case 'daily':
      next.setDate(next.getDate() + interval)
      break
    case 'weekly':
      next.setDate(next.getDate() + 7 * interval)
      break
    case 'monthly':
      next.setMonth(next.getMonth() + interval)
      break
    case 'yearly':
      next.setFullYear(next.getFullYear() + interval)
      break
    case 'seasonal': {
      // NZ-ish: advance ~3 months (season)
      next.setMonth(next.getMonth() + 3 * interval)
      break
    }
    default:
      return null
  }

  if (rule.until) {
    const until = new Date(rule.until)
    if (!Number.isNaN(until.getTime()) && next > until) return null
  }

  return next.toISOString()
}
