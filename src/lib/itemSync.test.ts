import { describe, expect, it } from 'vitest'
import type { GroceryItem } from '../types'
import { mergeItemFromServer, mergeServerItems } from './itemSync'

function item(
  id: string,
  checked: boolean,
  updated_at: string,
): GroceryItem {
  return {
    id,
    list_id: 'list-1',
    section: 'grocery',
    category: 'dairy',
    text: id,
    checked,
    added_by: 'Simon',
    sort_order: 0,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at,
    due_at: null,
    note: null,
  }
}

describe('mergeItemFromServer', () => {
  it('keeps an optimistic check when a stale snapshot has the same timestamp', () => {
    const local = item('milk', true, '2024-01-01T00:00:00.000Z')
    const incoming = item('milk', false, '2024-01-01T00:00:00.000Z')

    expect(mergeItemFromServer(local, incoming, true).checked).toBe(true)
  })

  it('keeps the local item when the server snapshot is older', () => {
    const local = item('milk', true, '2024-01-02T00:00:00.000Z')
    const incoming = item('milk', false, '2024-01-01T00:00:00.000Z')

    expect(mergeItemFromServer(local, incoming, undefined)).toBe(local)
  })

  it('accepts a newer server row', () => {
    const local = item('milk', false, '2024-01-01T00:00:00.000Z')
    const incoming = item('milk', true, '2024-01-02T00:00:00.000Z')

    expect(mergeItemFromServer(local, incoming, undefined)).toBe(incoming)
  })

  it('holds a pending check over a newer row that has not caught up', () => {
    const local = item('milk', true, '2024-01-01T00:00:00.000Z')
    const incoming = item('milk', false, '2024-01-02T00:00:00.000Z')

    expect(mergeItemFromServer(local, incoming, true)).toMatchObject({
      checked: true,
      updated_at: '2024-01-02T00:00:00.000Z',
    })
  })
})

describe('mergeServerItems', () => {
  it('drops items the server no longer returns', () => {
    const local = [item('milk', false, '2024-01-01T00:00:00.000Z')]
    const merged = mergeServerItems(local, [], new Map())
    expect(merged).toEqual([])
  })

  it('does not resurrect a checked item from a stale full snapshot', () => {
    const local = [item('milk', true, '2024-01-01T00:00:00.000Z')]
    const incoming = [item('milk', false, '2024-01-01T00:00:00.000Z')]
    const pending = new Map([['milk', true]])

    expect(mergeServerItems(local, incoming, pending)[0]?.checked).toBe(true)
  })
})
