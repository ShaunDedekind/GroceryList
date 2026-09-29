import { describe, expect, it } from 'vitest'
import type { GroceryItem } from '../types'
import {
  formatDueLabel,
  getHenryBucketId,
  groupHenryItems,
} from './henryBuckets'

function item(
  id: string,
  due_at: string | null,
  checked = false,
): GroceryItem {
  return {
    id,
    list_id: 'list-1',
    section: 'henry',
    category: 'health',
    text: id,
    checked,
    added_by: 'Simon',
    sort_order: 0,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    due_at,
    note: null,
  }
}

const NOW = new Date('2024-06-15T12:00:00')

describe('getHenryBucketId', () => {
  it('maps null due dates to someday', () => {
    expect(getHenryBucketId(null, NOW)).toBe('someday')
  })

  it('maps past days to overdue', () => {
    expect(getHenryBucketId('2024-06-14T09:00:00', NOW)).toBe('overdue')
  })

  it('maps today to today', () => {
    expect(getHenryBucketId('2024-06-15T18:00:00', NOW)).toBe('today')
  })

  it('maps within the next 7 days to this_week', () => {
    expect(getHenryBucketId('2024-06-18T10:00:00', NOW)).toBe('this_week')
  })

  it('maps beyond a week to later', () => {
    expect(getHenryBucketId('2024-07-01T10:00:00', NOW)).toBe('later')
  })
})

describe('groupHenryItems', () => {
  it('hides checked items unless showDone', () => {
    const items = [
      item('a', '2024-06-15T09:00:00', true),
      item('b', null, false),
    ]
    expect(groupHenryItems(items, { now: NOW })).toHaveLength(1)
    expect(groupHenryItems(items, { now: NOW, showDone: true }).flatMap((b) => b.items)).toHaveLength(2)
  })

  it('orders buckets and sorts by due_at', () => {
    const buckets = groupHenryItems(
      [
        item('later', '2024-08-01T00:00:00'),
        item('today-late', '2024-06-15T18:00:00'),
        item('today-early', '2024-06-15T09:00:00'),
        item('overdue', '2024-06-10T00:00:00'),
      ],
      { now: NOW },
    )
    expect(buckets.map((b) => b.id)).toEqual(['overdue', 'today', 'later'])
    expect(buckets.find((b) => b.id === 'today')?.items.map((i) => i.id)).toEqual([
      'today-early',
      'today-late',
    ])
  })
})

describe('formatDueLabel', () => {
  it('formats someday and today with time', () => {
    expect(formatDueLabel(null, NOW)).toBe('Someday')
    expect(formatDueLabel('2024-06-15T15:30:00', NOW)).toMatch(/^Today/)
  })
})
