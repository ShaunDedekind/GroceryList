import type { ParsedItem } from './parseItemSchema'
import { getSession } from './storage'

export async function parseNaturalLanguageItem(
  text: string,
  sectionHint: 'home' | 'henry',
): Promise<{ ok: boolean; parsed: ParsedItem; fallback?: boolean }> {
  const session = getSession()
  if (!session?.listCode) {
    return {
      ok: false,
      fallback: true,
      parsed: {
        title: text,
        tab: sectionHint,
        category: 'other',
        owner: 'shared',
        item_kind: 'task',
        due_at: null,
        recurrence: null,
        amount_cents: null,
        provider: null,
        confidence: 0,
        note: null,
      },
    }
  }

  try {
    const res = await fetch('/api/parse-item', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-list-code': session.listCode,
      },
      body: JSON.stringify({ text, sectionHint }),
    })
    const data = (await res.json()) as {
      ok?: boolean
      fallback?: boolean
      parsed: ParsedItem
    }
    if (!data.parsed) throw new Error('bad_response')
    return {
      ok: Boolean(data.ok),
      fallback: data.fallback,
      parsed: data.parsed,
    }
  } catch {
    return {
      ok: false,
      fallback: true,
      parsed: {
        title: text,
        tab: sectionHint,
        category: 'other',
        owner: 'shared',
        item_kind: 'task',
        due_at: null,
        recurrence: null,
        amount_cents: null,
        provider: null,
        confidence: 0,
        note: null,
      },
    }
  }
}
