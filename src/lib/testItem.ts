import type { GroceryItem, ListSection, ItemCategoryId } from '../types'

/** Minimal GroceryItem factory for unit tests. */
export function testItem(
  overrides: Partial<GroceryItem> & Pick<GroceryItem, 'id'>,
): GroceryItem {
  return {
    list_id: 'list-1',
    section: 'grocery' as ListSection,
    category: 'other' as ItemCategoryId,
    text: overrides.id,
    checked: false,
    added_by: 'Shaun',
    sort_order: 0,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    due_at: null,
    note: null,
    owner: 'shared',
    item_kind: 'task',
    amount_cents: null,
    provider: null,
    paid_at: null,
    recurrence: null,
    source: 'manual',
    inbound_email_id: null,
    ...overrides,
  }
}
