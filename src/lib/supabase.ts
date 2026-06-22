import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getSession } from './storage'
import type { CategoryId } from '../types'
import type { ParsedItem } from './parseItems'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env.local and fill in your Supabase credentials.',
  )
}

let listCode: string | null = null

export function setListCode(code: string | null): void {
  listCode = code?.toUpperCase() ?? null
}

export function initListCodeFromSession(): void {
  const session = getSession()
  setListCode(session?.listCode ?? null)
}

const customFetch: typeof fetch = (input, init) => {
  const headers = new Headers(init?.headers)
  const code = listCode ?? getSession()?.listCode
  if (code) {
    headers.set('x-list-code', code.toUpperCase())
  }
  return fetch(input, { ...init, headers })
}

export const supabase: SupabaseClient = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder',
  {
    global: { fetch: customFetch },
  },
)

export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
      supabaseAnonKey &&
      supabaseUrl !== 'https://placeholder.supabase.co',
  )
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export async function createList(name = 'Our Grocery List') {
  const code = generateCode()
  const { data, error } = await supabase.rpc('create_list', {
    p_code: code,
    p_name: name,
  })

  if (error) throw error
  return data as { id: string; code: string; name: string }
}

export async function joinList(code: string) {
  const { data, error } = await supabase.rpc('join_list', {
    p_code: code.toUpperCase().trim(),
  })

  if (error) throw error
  if (!data) throw new Error('List not found. Check the code and try again.')
  return data as { id: string; code: string; name: string }
}

export async function updateListName(listId: string, name: string) {
  const { error } = await supabase
    .from('lists')
    .update({ name })
    .eq('id', listId)

  if (error) throw error
}

export async function parseItemsWithAI(text: string): Promise<ParsedItem[]> {
  const { data, error } = await supabase.functions.invoke('parse-items', {
    body: { text },
  })

  const payload = data as { items?: ParsedItem[]; error?: string } | null

  if (error) {
    const message =
      payload?.error ?? error.message ?? 'Smart parse failed'
    throw new Error(message)
  }

  if (!payload) {
    throw new Error('Smart parse returned no data')
  }

  if (payload.error) {
    throw new Error(payload.error)
  }

  if (!payload.items?.length) {
    throw new Error('No items found in that text')
  }

  return payload.items.map((item) => ({
    text: item.text.trim(),
    category: item.category as CategoryId,
    source: 'ai' as const,
  }))
}
