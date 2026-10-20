import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-list-code',
}

const BUILTIN_CATEGORIES = [
  'fruit_veg',
  'snacks',
  'sweet_tooth',
  'meat',
  'dairy',
  'deli',
  'bakery',
  'pantry',
  'frozen',
  'drinks',
  'personal_care',
  'household',
  'other',
] as const

const MODEL = 'claude-haiku-4-5-20251001'
const MAX_ITEMS = 50
const RATE_LIMIT = 30
const RATE_WINDOW_MS = 24 * 60 * 60 * 1000

const CUSTOM_ID_PATTERN = /^custom_[a-z0-9]+(?:_[a-z0-9]+)*$/

interface CustomCategory {
  id: string
  label: string
  emoji?: string
  keywords?: string[]
}

interface CategoryConfig {
  order?: string[]
  hidden?: string[]
  labels?: Record<string, string>
  custom?: CustomCategory[]
}

function isCustomCategoryId(value: unknown): value is string {
  return typeof value === 'string' && CUSTOM_ID_PATTERN.test(value)
}

function parseCategoryConfig(raw: unknown): CategoryConfig {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const obj = raw as Record<string, unknown>
  const custom: CustomCategory[] = []
  if (Array.isArray(obj.custom)) {
    for (const entry of obj.custom) {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue
      const row = entry as Record<string, unknown>
      if (!isCustomCategoryId(row.id)) continue
      if (typeof row.label !== 'string' || !row.label.trim()) continue
      const keywords = Array.isArray(row.keywords)
        ? row.keywords.filter((k): k is string => typeof k === 'string' && k.trim().length > 0)
        : undefined
      custom.push({
        id: row.id,
        label: row.label.trim(),
        ...(typeof row.emoji === 'string' ? { emoji: row.emoji } : {}),
        ...(keywords?.length ? { keywords } : {}),
      })
    }
  }
  return { custom: custom.length ? custom : undefined }
}

function buildSystemPrompt(config: CategoryConfig): string {
  const custom = config.custom ?? []
  const categoryIds = [...BUILTIN_CATEGORIES, ...custom.map((entry) => entry.id)]
  const customGuide =
    custom.length === 0
      ? ''
      : `\nCustom aisles for this list:\n${custom
          .map((entry) => {
            const keywords = entry.keywords?.length
              ? ` (keywords: ${entry.keywords.join(', ')})`
              : ''
            return `- ${entry.id}: ${entry.label}${keywords}`
          })
          .join('\n')}\nPrefer a matching custom aisle when keywords or labels fit.`

  return `You extract grocery items from pasted text (shopping lists, recipes, meal plans).
Return ONLY valid JSON with this exact shape: {"items":[{"text":"item name","category":"category_id"}]}
Use short grocery item names only — no amounts or units (e.g. "cumin" not "1 tsp cumin", "eggs" not "2 eggs"). Strip cooking instructions and prep notes.
Categories must be exactly one of: ${categoryIds.join(', ')}.
Category guide:
- fruit_veg: produce, herbs, fresh vegetables and fruit
- snacks: chips, crackers, savory snack foods
- sweet_tooth: candy, chocolate, biscuits, cookies, lollies, shelf sweets
- meat: meat, poultry, fish, seafood
- dairy: milk, cheese, eggs, yogurt, butter
- deli: prepared foods, hummus, rotisserie chicken, deli salads
- bakery: bread, buns, pastries, tortillas
- pantry: dry goods, canned goods, pasta shapes (rigatoni, penne, spaghetti, etc.), rice, spices, oils, sauces
- frozen: frozen foods, ice cream
- drinks: beverages including alcohol
- personal_care: shampoo, vitamins, cotton tips, toiletries
- household: cleaning, paper goods, laundry
- other: anything else${customGuide}
Max 50 items. Skip non-food items unless clearly on a shopping list.`
}

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
    .select('id, category_config')
    .eq('code', listCode)
    .maybeSingle()

  if (listError || !list) {
    return jsonResponse({ error: 'List not found' }, 404)
  }

  const categoryConfig = parseCategoryConfig(list.category_config)
  const validCategories = new Set<string>([
    ...BUILTIN_CATEGORIES,
    ...(categoryConfig.custom ?? []).map((entry) => entry.id),
  ])

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
          text: buildSystemPrompt(categoryConfig),
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
      if (!validCategories.has(item.category)) {
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
