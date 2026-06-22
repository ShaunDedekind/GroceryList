import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-list-code',
}

const VALID_CATEGORIES = new Set([
  'fruit_veg',
  'meat',
  'dairy',
  'bakery',
  'pantry',
  'frozen',
  'drinks',
  'household',
  'other',
])

const MODEL = 'claude-haiku-4-5-20251001'
const MAX_ITEMS = 50
const RATE_LIMIT = 30
const RATE_WINDOW_MS = 24 * 60 * 60 * 1000

const SYSTEM_PROMPT = `You extract grocery items from pasted text (shopping lists, recipes, meal plans).
Return ONLY valid JSON with this exact shape: {"items":[{"text":"item name","category":"category_id"}]}
Use short grocery item names (strip quantities, units, and cooking instructions).
Categories must be exactly one of: fruit_veg, meat, dairy, bakery, pantry, frozen, drinks, household, other.
Category guide:
- fruit_veg: produce, herbs, fresh vegetables and fruit
- meat: meat, poultry, fish, seafood
- dairy: milk, cheese, eggs, yogurt, butter
- bakery: bread, buns, pastries, tortillas
- pantry: dry goods, canned goods, pasta, rice, spices, oils, sauces
- frozen: frozen foods, ice cream
- drinks: beverages including alcohol
- household: cleaning, paper goods, toiletries
- other: anything else
Max 50 items. Skip non-food items unless clearly on a shopping list.`

interface ParsedItem {
  text: string
  category: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!anthropicKey) {
    return jsonResponse({ error: 'AI parsing is not configured' }, 503)
  }
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: 'Server configuration error' }, 500)
  }

  const listCode = req.headers.get('x-list-code')?.toUpperCase().trim()
  if (!listCode) {
    return jsonResponse({ error: 'List code required' }, 401)
  }

  let body: { text?: string }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }

  const text = body.text?.trim()
  if (!text) {
    return jsonResponse({ error: 'Text is required' }, 400)
  }
  if (text.length > 8000) {
    return jsonResponse({ error: 'Text too long (max 8000 characters)' }, 400)
  }

  const admin = createClient(supabaseUrl, serviceRoleKey)

  const { data: list, error: listError } = await admin
    .from('lists')
    .select('id')
    .eq('code', listCode)
    .maybeSingle()

  if (listError || !list) {
    return jsonResponse({ error: 'List not found' }, 404)
  }

  const since = new Date(Date.now() - RATE_WINDOW_MS).toISOString()
  const { count, error: countError } = await admin
    .from('ai_parse_usage')
    .select('*', { count: 'exact', head: true })
    .eq('list_id', list.id)
    .gte('created_at', since)

  if (countError) {
    console.error('Rate limit check failed:', countError.message)
    return jsonResponse({ error: 'Could not verify rate limit' }, 500)
  }

  if ((count ?? 0) >= RATE_LIMIT) {
    return jsonResponse(
      { error: 'Smart parse limit reached (30 per day). Try again tomorrow.' },
      429,
    )
  }

  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: text }],
    }),
  })

  if (!anthropicRes.ok) {
    const errText = await anthropicRes.text()
    console.error('Anthropic error:', anthropicRes.status, errText)
    return jsonResponse({ error: 'AI parsing failed. Please try again.' }, 502)
  }

  const anthropicData = await anthropicRes.json()
  const rawContent = anthropicData.content?.find(
    (block: { type: string }) => block.type === 'text',
  )?.text

  if (!rawContent) {
    return jsonResponse({ error: 'AI returned an empty response' }, 502)
  }

  let parsed: { items?: ParsedItem[] }
  try {
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/)
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawContent)
  } catch {
    return jsonResponse({ error: 'Could not parse AI response' }, 502)
  }

  const items = (parsed.items ?? [])
    .map((item) => ({
      text: String(item.text ?? '').trim(),
      category: String(item.category ?? 'other'),
      source: 'ai' as const,
    }))
    .filter((item) => item.text.length > 0)
    .filter((item) => {
      if (!VALID_CATEGORIES.has(item.category)) {
        item.category = 'other'
      }
      return true
    })
    .slice(0, MAX_ITEMS)

  if (items.length === 0) {
    return jsonResponse({ error: 'No grocery items found in that text' }, 422)
  }

  const { error: usageError } = await admin.from('ai_parse_usage').insert({
    list_id: list.id,
  })

  if (usageError) {
    console.error('Usage insert failed:', usageError.message)
  }

  return jsonResponse({ items })
})

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}
