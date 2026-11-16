import { createAnthropic } from '@ai-sdk/anthropic'
import { generateObject } from 'ai'
import { createClient } from '@supabase/supabase-js'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { parsedItemSchema } from '../src/lib/parseItemSchema'

export const config = {
  runtime: 'nodejs',
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function parseAllowlist(): Set<string> {
  return new Set(
    (process.env.EMAIL_ALLOWLIST ?? 'shaundedekind@gmail.com')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  )
}

function verifyPostmarkBasic(req: Request): boolean {
  const user = process.env.EMAIL_WEBHOOK_USER
  const pass = process.env.EMAIL_WEBHOOK_SECRET
  if (!user || !pass) return false
  const header = req.headers.get('authorization') ?? ''
  if (!header.startsWith('Basic ')) return false
  const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8')
  const expected = `${user}:${pass}`
  const a = Buffer.from(decoded)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

function verifySharedSecret(req: Request, rawBody: string): boolean {
  const secret = process.env.EMAIL_WEBHOOK_SECRET
  if (!secret) return false
  const sig = req.headers.get('x-home-os-signature') ?? ''
  const digest = createHmac('sha256', secret).update(rawBody).digest('hex')
  try {
    const a = Buffer.from(sig)
    const b = Buffer.from(digest)
    return a.length === b.length && timingSafeEqual(a, b)
  } catch {
    return false
  }
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' })

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!supabaseUrl || !serviceKey) return json(503, { error: 'not_configured' })

  const rawBody = await req.text()
  const authed = verifyPostmarkBasic(req) || verifySharedSecret(req, rawBody)
  if (!authed) {
    // Reject silently for scanners
    return json(200, { ok: true, ignored: true })
  }

  let body: Record<string, unknown>
  try {
    body = JSON.parse(rawBody) as Record<string, unknown>
  } catch {
    return json(200, { ok: true, ignored: true })
  }

  const fromAddress = String(
    body.FromFull && typeof body.FromFull === 'object'
      ? (body.FromFull as { Email?: string }).Email ?? body.From ?? ''
      : body.From ?? body.from ?? '',
  )
    .trim()
    .toLowerCase()

  const allowlist = parseAllowlist()
  if (!fromAddress || !allowlist.has(fromAddress)) {
    return json(200, { ok: true, ignored: true, reason: 'not_allowlisted' })
  }

  const subject = String(body.Subject ?? body.subject ?? '')
  const textBody = String(body.TextBody ?? body.text ?? body.strippedText ?? '')
  const excerpt = textBody.slice(0, 800)
  const listCode =
    String(process.env.HOME_OS_LIST_CODE ?? '').trim().toUpperCase() ||
    String(body.MailboxHash ?? '')
      .trim()
      .toUpperCase()

  const supabase = createClient(supabaseUrl, serviceKey)
  let listId: string | null = null
  if (listCode) {
    const { data } = await supabase
      .from('lists')
      .select('id')
      .eq('code', listCode)
      .maybeSingle()
    listId = data?.id ?? null
  }
  if (!listId) {
    const { data } = await supabase.from('lists').select('id').limit(1).maybeSingle()
    listId = data?.id ?? null
  }
  if (!listId) return json(200, { ok: true, ignored: true, reason: 'no_list' })

  const { data: inbound, error: insertError } = await supabase
    .from('inbound_emails')
    .insert({
      list_id: listId,
      from_address: fromAddress,
      subject,
      body_text: excerpt,
      status: 'received',
      raw_payload: {
        provider: 'postmark_or_generic',
        received_headers: {
          messageId: body.MessageID ?? null,
        },
      },
      body_excerpt: excerpt,
    })
    .select()
    .single()

  if (insertError || !inbound) {
    console.error(insertError)
    return json(500, { error: 'insert_failed' })
  }

  if (!apiKey) {
    await supabase
      .from('inbound_emails')
      .update({
        status: 'processed',
        decision: 'needs_review',
        confidence: 0,
        parse_result: { title: subject || 'Email', tab: 'home', category: 'other' },
      })
      .eq('id', inbound.id)
    return json(200, { ok: true, decision: 'needs_review' })
  }

  try {
    const anthropic = createAnthropic({ apiKey })
    const today = new Date().toISOString().slice(0, 10)
    const { object } = await generateObject({
      model: anthropic('claude-haiku-4-5-20251001'),
      schema: parsedItemSchema,
      prompt: `Parse this forwarded email into a Home OS item.
Today: ${today}.
From: ${fromAddress}
Subject: ${subject}
Body excerpt: """${excerpt}"""`,
    })

    const confidence = object.confidence ?? 0.5
    const decision = confidence >= 0.75 ? 'auto_filed' : 'needs_review'

    await supabase
      .from('inbound_emails')
      .update({
        status: 'processed',
        parse_result: object,
        confidence,
        decision,
        body_text: null,
      })
      .eq('id', inbound.id)

    if (decision === 'auto_filed') {
      await supabase.from('items').insert({
        list_id: listId,
        section: object.tab,
        category: object.category,
        text: object.title,
        owner: object.owner,
        item_kind: object.item_kind,
        due_at: object.due_at ?? null,
        note: object.note ?? null,
        amount_cents: object.amount_cents ?? null,
        provider: object.provider ?? null,
        recurrence: object.recurrence ?? null,
        source: 'email',
        inbound_email_id: inbound.id,
        added_by: 'email',
        sort_order: Date.now() % 100000,
      })
    }

    return json(200, { ok: true, decision, confidence })
  } catch (error) {
    console.error(error)
    await supabase
      .from('inbound_emails')
      .update({ status: 'failed', decision: 'needs_review' })
      .eq('id', inbound.id)
    return json(200, { ok: true, decision: 'needs_review' })
  }
}
