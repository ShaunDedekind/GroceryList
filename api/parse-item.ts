import { createAnthropic } from '@ai-sdk/anthropic'
import { generateObject } from 'ai'
import { createClient } from '@supabase/supabase-js'
import { parsedItemSchema } from '../src/lib/parseItemSchema'

export const config = {
  runtime: 'nodejs',
}

const MAX_PER_DAY = Number(process.env.PARSE_ITEM_MAX_PER_DAY ?? 60)

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' })

  const listCode = req.headers.get('x-list-code')?.trim().toUpperCase()
  if (!listCode) return json(401, { error: 'missing_list_code' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!apiKey || !supabaseUrl || !serviceKey) {
    return json(503, { error: 'not_configured' })
  }

  let payload: { text?: string; sectionHint?: 'home' | 'henry' }
  try {
    payload = (await req.json()) as { text?: string; sectionHint?: 'home' | 'henry' }
  } catch {
    return json(400, { error: 'invalid_json' })
  }

  const text = payload.text?.trim()
  if (!text) return json(400, { error: 'missing_text' })

  const supabase = createClient(supabaseUrl, serviceKey)
  const { data: list } = await supabase
    .from('lists')
    .select('id')
    .eq('code', listCode)
    .maybeSingle()

  if (!list?.id) return json(404, { error: 'list_not_found' })

  const since = new Date()
  since.setUTCHours(0, 0, 0, 0)
  const { count } = await supabase
    .from('ai_nl_usage')
    .select('*', { count: 'exact', head: true })
    .eq('list_id', list.id)
    .gte('created_at', since.toISOString())

  if ((count ?? 0) >= MAX_PER_DAY) {
    return json(429, { error: 'rate_limited' })
  }

  const anthropic = createAnthropic({ apiKey })
  const today = new Date().toISOString().slice(0, 10)

  try {
    const { object } = await generateObject({
      model: anthropic('claude-haiku-4-5-20251001'),
      schema: parsedItemSchema,
      prompt: `Parse this household to-do into structured fields for a NZ home (Shaun & Rosie, baby Henry).
Today is ${today} (ISO date). Prefer local NZ context for seasons.
Hint tab: ${payload.sectionHint ?? 'unknown'}.
Home categories: maintenance, purchases, bills, admin, cleaning, supplies, garden, kids, pets, other.
Henry categories: health, activities, admin, gear, other.
Item kinds: task, bill, session, maintenance, purchase, milestone.
Owner: shaun, rosie, or shared.
If a money amount appears, set amount_cents (NZD * 100) and provider when clear.
If weekly/monthly/yearly/seasonal recurrence is implied, set recurrence.
due_at must be ISO timestamptz or null.
Raw text: """${text}"""`,
    })

    await supabase.from('ai_nl_usage').insert({ list_id: list.id })

    return json(200, { ok: true, parsed: object })
  } catch (error) {
    console.error('parse-item failed', error)
    return json(200, {
      ok: false,
      fallback: true,
      parsed: {
        title: text,
        tab: payload.sectionHint ?? 'home',
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
    })
  }
}
