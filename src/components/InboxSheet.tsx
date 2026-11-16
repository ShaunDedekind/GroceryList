import { useCallback, useEffect, useState } from 'react'
import type { Session } from '../types'
import { supabase } from '../lib/supabase'
import { BottomSheet } from './BottomSheet'

interface InboundRow {
  id: string
  subject: string | null
  from_address: string | null
  body_excerpt: string | null
  confidence: number | null
  decision: string | null
  parse_result: {
    title?: string
    tab?: string
    category?: string
    item_kind?: string
    due_at?: string | null
    owner?: string
  } | null
  received_at: string
}

interface InboxSheetProps {
  session: Session
  onClose: () => void
}

export function InboxSheet({ session, onClose }: InboxSheetProps) {
  const [rows, setRows] = useState<InboundRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error: fetchError } = await supabase
      .from('inbound_emails')
      .select(
        'id, subject, from_address, body_excerpt, confidence, decision, parse_result, received_at',
      )
      .eq('list_id', session.listId)
      .eq('decision', 'needs_review')
      .order('received_at', { ascending: false })
      .limit(50)

    if (fetchError) {
      setError(fetchError.message)
      setRows([])
    } else {
      setError(null)
      setRows((data as InboundRow[]) ?? [])
    }
    setLoading(false)
  }, [session.listId])

  useEffect(() => {
    void load()
  }, [load])

  const fileItem = async (row: InboundRow) => {
    const parsed = row.parse_result
    if (!parsed?.title) return
    const { error: insertError } = await supabase.from('items').insert({
      list_id: session.listId,
      section: parsed.tab === 'henry' ? 'henry' : 'home',
      category: parsed.category ?? 'other',
      text: parsed.title,
      owner: parsed.owner ?? 'shared',
      item_kind: parsed.item_kind ?? 'task',
      due_at: parsed.due_at ?? null,
      source: 'email',
      inbound_email_id: row.id,
      added_by: session.displayName,
      sort_order: Date.now() % 100000,
    })
    if (insertError) {
      setError(insertError.message)
      return
    }
    await supabase
      .from('inbound_emails')
      .update({ decision: 'auto_filed' })
      .eq('id', row.id)
    void load()
  }

  const dismiss = async (id: string) => {
    await supabase
      .from('inbound_emails')
      .update({ decision: 'rejected' })
      .eq('id', id)
    void load()
  }

  return (
    <BottomSheet onClose={onClose} maxHeightClass="max-h-vv-92">
      <h3 className="text-headline font-semibold text-ink dark:text-ink-dark">
        Email inbox
      </h3>
      <p className="mt-1 text-footnote text-warm-gray dark:text-warm-gray-light">
        Low-confidence forwards wait here. High-confidence ones file automatically.
      </p>

      {error && (
        <p className="mt-3 rounded-[var(--radius-md)] bg-error-banner px-3 py-2 text-footnote">
          {error}
        </p>
      )}

      {loading ? (
        <p className="mt-6 text-body text-warm-gray">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="mt-6 text-body text-warm-gray dark:text-warm-gray-light">
          Inbox is clear
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((row) => (
            <li
              key={row.id}
              className="rounded-[var(--radius-md)] bg-cream-dark p-3 dark:bg-surface"
            >
              <p className="text-body font-semibold text-ink dark:text-ink-dark">
                {row.parse_result?.title ?? row.subject ?? 'Email'}
              </p>
              <p className="mt-1 text-meta text-warm-gray dark:text-warm-gray-light">
                from {row.from_address ?? 'unknown'}
                {row.confidence != null
                  ? ` · ${Math.round(row.confidence * 100)}%`
                  : ''}
              </p>
              {row.body_excerpt && (
                <p className="mt-2 line-clamp-3 text-footnote text-warm-gray dark:text-warm-gray-light">
                  {row.body_excerpt}
                </p>
              )}
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => void fileItem(row)}
                  className="min-h-11 flex-1 rounded-[var(--radius-md)] bg-sage text-meta font-semibold text-cream"
                >
                  File it
                </button>
                <button
                  type="button"
                  onClick={() => void dismiss(row.id)}
                  className="min-h-11 flex-1 rounded-[var(--radius-md)] bg-cream text-meta font-semibold text-ink dark:bg-surface-raised dark:text-ink-dark"
                >
                  Dismiss
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </BottomSheet>
  )
}
