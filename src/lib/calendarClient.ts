import type { GroceryItem } from '../types'
import { getSession } from './storage'

/** Best-effort one-way sync to Google Calendar via Vercel API. */
export async function syncCalendarForItem(
  action: 'upsert' | 'delete',
  item: Pick<GroceryItem, 'id' | 'list_id' | 'text' | 'due_at' | 'note' | 'item_kind'>,
): Promise<void> {
  const session = getSession()
  if (!session?.listCode) return

  const dated =
    item.item_kind === 'bill' ||
    item.item_kind === 'session' ||
    item.item_kind === 'maintenance' ||
    Boolean(item.due_at)
  if (action === 'upsert' && !dated) return

  try {
    await fetch('/api/calendar-sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-list-code': session.listCode,
      },
      body: JSON.stringify({
        action,
        item: {
          id: item.id,
          list_id: item.list_id,
          text: item.text,
          due_at: item.due_at,
          note: item.note,
        },
      }),
    })
  } catch {
    // Calendar is optional; never block the UI.
  }
}
