import { describe, expect, it } from 'vitest'
import type { CategoryId, GroceryItem } from '../types'
import {
  applyOrderUpdates,
  computeReorderPatch,
  nextSortOrder,
  sortItems,
  sortItemsInCategory,
  sortShopItems,
} from './itemOrder'

const CATEGORY_IDS: CategoryId[] = ['dairy', 'pantry', 'other']

function item(
  id: string,
  category: CategoryId,
  text: string,
  sort_order: number,
  checked = false,
  created_at = '2024-01-01T00:00:00Z',
): GroceryItem {
  return {
    id,
    list_id: 'list-1',
    section: 'grocery',
    category,
    text,
    checked,
    added_by: 'Simon',
    sort_order,
    created_at,
    updated_at: created_at,
  }
}

describe('sortItems', () => {
  it('sorts unchecked before checked, then sort_order, then created_at', () => {
    const items = [
      item('b', 'dairy', 'butter', 1, true, '2024-01-02T00:00:00Z'),
      item('a', 'dairy', 'apple', 0, false, '2024-01-03T00:00:00Z'),
      item('c', 'dairy', 'cream', 0, false, '2024-01-01T00:00:00Z'),
    ]

    expect(sortItems(items).map((entry) => entry.id)).toEqual(['c', 'a', 'b'])
  })
})

describe('sortItemsInCategory', () => {
  it('returns only items in the requested category', () => {
    const items = [
      item('1', 'dairy', 'milk', 0),
      item('2', 'pantry', 'rice', 0),
      item('3', 'dairy', 'eggs', 1),
    ]

    expect(sortItemsInCategory(items, 'dairy').map((entry) => entry.id)).toEqual([
      '1',
      '3',
    ])
  })
})

describe('nextSortOrder', () => {
  it('returns max sort_order plus one in category', () => {
    const items = [
      item('1', 'dairy', 'milk', 0),
      item('2', 'dairy', 'eggs', 3),
      item('3', 'pantry', 'rice', 9),
    ]

    expect(nextSortOrder(items, 'dairy')).toBe(4)
    expect(nextSortOrder(items, 'other')).toBe(0)
  })
})

describe('computeReorderPatch', () => {
  const items = [
    item('a', 'dairy', 'milk', 0),
    item('b', 'dairy', 'eggs', 1),
    item('c', 'pantry', 'rice', 0),
    item('d', 'pantry', 'pasta', 1),
  ]

  it('reorders within a category', () => {
    const patch = computeReorderPatch('b', 'a', items, CATEGORY_IDS)
    expect(patch).toEqual([
      { id: 'b', category: 'dairy', sort_order: 0 },
      { id: 'a', category: 'dairy', sort_order: 1 },
    ])
  })

  it('moves an item to another category', () => {
    const patch = computeReorderPatch('a', 'c', items, CATEGORY_IDS)
    expect(patch).toEqual([
      { id: 'a', category: 'pantry', sort_order: 0 },
      { id: 'c', category: 'pantry', sort_order: 1 },
      { id: 'd', category: 'pantry', sort_order: 2 },
      { id: 'b', category: 'dairy', sort_order: 0 },
    ])
  })

  it('appends to an empty category droppable', () => {
    const patch = computeReorderPatch('a', 'other', items, CATEGORY_IDS)
    expect(patch).toEqual([
      { id: 'a', category: 'other', sort_order: 0 },
      { id: 'b', category: 'dairy', sort_order: 0 },
    ])
  })
})

describe('sortShopItems', () => {
  it('returns unchecked items sorted by category order then sort_order', () => {
    const items = [
      item('1', 'pantry', 'rice', 0),
      item('2', 'dairy', 'milk', 1, true),
      item('3', 'dairy', 'eggs', 0),
      item('4', 'pantry', 'pasta', 1),
      item('5', 'other', 'soap', 0),
    ]

    expect(sortShopItems(items, CATEGORY_IDS).map((entry) => entry.id)).toEqual([
      '3',
      '1',
      '4',
      '5',
    ])
  })
})

describe('applyOrderUpdates', () => {
  it('applies category and sort_order patches', () => {
    const items = [
      item('a', 'dairy', 'milk', 0),
      item('b', 'dairy', 'eggs', 1),
    ]

    const next = applyOrderUpdates(items, [
      { id: 'b', category: 'dairy', sort_order: 0 },
      { id: 'a', category: 'dairy', sort_order: 1 },
    ])

    expect(next.map((entry) => entry.id)).toEqual(['b', 'a'])
    expect(next[0].sort_order).toBe(0)
    expect(next[1].sort_order).toBe(1)
  })
})
