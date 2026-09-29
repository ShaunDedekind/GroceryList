import { describe, expect, it } from 'vitest'
import type { GroceryItem } from '../types'
import { getBuyAgainChips } from './buyAgain'

function item(
  id: string,
  text: string,
  checked: boolean,
  updated_at: string,
  category: GroceryItem['category'] = 'dairy',
): GroceryItem {
  return {
    id,
    list_id: 'list-1',
    section: 'grocery',
    category,
    text,
    checked,
    added_by: 'Simon',
    sort_order: 0,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at,
    due_at: null,
    note: null,
  }
}

describe('getBuyAgainChips', () => {
  it('returns empty when nothing is checked', () => {
    expect(getBuyAgainChips([item('1', 'milk', false, '2024-01-02T00:00:00.000Z')])).toEqual([])
  })

  it('dedupes by lowercased text and keeps the most recent category', () => {
    const chips = getBuyAgainChips([
      item('1', 'Milk', true, '2024-01-01T00:00:00.000Z', 'dairy'),
      item('2', 'milk', true, '2024-01-03T00:00:00.000Z', 'drinks'),
      item('3', 'bread', true, '2024-01-02T00:00:00.000Z', 'bakery'),
    ])

    expect(chips).toEqual([
      { text: 'milk', category: 'drinks' },
      { text: 'bread', category: 'bakery' },
    ])
  })

  it('respects the limit', () => {
    const items = Array.from({ length: 5 }, (_, i) =>
      item(String(i), `item ${i}`, true, `2024-01-0${i + 1}T00:00:00.000Z`),
    )
    expect(getBuyAgainChips(items, 2)).toHaveLength(2)
  })
})
