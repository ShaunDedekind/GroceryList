import { createClient } from '@supabase/supabase-js'

export const config = { runtime: 'nodejs' }

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' })

  const listCode = req.headers.get('x-list-code')?.trim().toUpperCase()
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!listCode || !supabaseUrl || !serviceKey) {
    return json(401, { error: 'unauthorized' })
  }

  const body = (await req.json()) as {
    person?: 'shaun' | 'rosie'
    subscription?: {
      endpoint: string
      keys: { p256dh: string; auth: string }
    }
  }

  if (!body.person || !body.subscription?.endpoint) {
    return json(400, { error: 'invalid_body' })
  }

  const supabase = createClient(supabaseUrl, serviceKey)
  const { data: list } = await supabase
    .from('lists')
    .select('id')
    .eq('code', listCode)
    .maybeSingle()
  if (!list?.id) return json(404, { error: 'list_not_found' })

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      list_id: list.id,
      person: body.person,
      endpoint: body.subscription.endpoint,
      p256dh: body.subscription.keys.p256dh,
      auth: body.subscription.keys.auth,
    },
    { onConflict: 'list_id,endpoint' },
  )

  if (error) return json(500, { error: error.message })
  return json(200, {
    ok: true,
    vapidPublicKey: process.env.VAPID_PUBLIC_KEY ?? null,
  })
}
