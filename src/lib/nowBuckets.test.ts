import { describe, expect, it } from 'vitest'
import { testItem } from './testItem'
import { buildNowSummary, getNowBucketId, groupNowItems } from './nowBuckets'

const NOW = new Date('2024-06-15T12:00:00')

describe('getNowBucketId', () => {
  it('maps beyond a week to coming_up', () => {
    expect(getNowBucketId('2024-07-01T10:00:00', NOW)).toBe('coming_up')
  })
})

describe('groupNowItems', () => {
  it('shows someday expanded by default', () => {
    const buckets = groupNowItems(
      [testItem({ id: 'a', section: 'home', due_at: null })],
      { now: NOW },
    )
    expect(buckets[0]?.id).toBe('someday')
    expect(buckets[0]?.defaultCollapsed).toBe(false)
  })
})

describe('buildNowSummary', () => {
  it('summarises bills due this week', () => {
    const summary = buildNowSummary(
      [
        testItem({
          id: 'bill',
          section: 'home',
          category: 'bills',
          item_kind: 'bill',
          text: 'Power',
          due_at: '2024-06-16T00:00:00',
        }),
      ],
      NOW,
    )
    expect(summary).toContain('bill')
  })
})
