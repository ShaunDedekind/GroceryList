/**
 * Export grocery-section items for a list to data/grocery-export-<date>.json
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... LIST_CODE=ABC123 node scripts/export-grocery.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const code = (process.env.LIST_CODE || '').trim().toUpperCase()

if (!url || !key || !code) {
  console.error('Need SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, LIST_CODE')
  process.exit(1)
}

const supabase = createClient(url, key)
const { data: list, error: listError } = await supabase
  .from('lists')
  .select('id, code, name')
  .eq('code', code)
  .single()

if (listError || !list) {
  console.error(listError ?? 'list not found')
  process.exit(1)
}

const { data: items, error } = await supabase
  .from('items')
  .select('*')
  .eq('list_id', list.id)
  .eq('section', 'grocery')
  .order('sort_order', { ascending: true })

if (error) {
  console.error(error)
  process.exit(1)
}

const stamp = new Date().toISOString().slice(0, 10)
const payload = {
  exported_at: new Date().toISOString(),
  list: { id: list.id, code: list.code, name: list.name },
  section: 'grocery',
  items: items ?? [],
}

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'data')
mkdirSync(dir, { recursive: true })
const out = join(dir, `grocery-export-${stamp}.json`)
writeFileSync(out, JSON.stringify(payload, null, 2))
console.log(`Wrote ${out} (${payload.items.length} items)`)
