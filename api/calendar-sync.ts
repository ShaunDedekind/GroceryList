import { createClient } from '@supabase/supabase-js'

export const config = { runtime: 'nodejs' }

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

async function getAccessToken(): Promise<string | null> {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n')
  if (!email || !key) return null

  const now = Math.floor(Date.now() / 1000)
  const header = Buffer.from(
    JSON.stringify({ alg: 'RS256', typ: 'JWT' }),
  ).toString('base64url')
  const claim = Buffer.from(
    JSON.stringify({
      iss: email,
      scope: 'https://www.googleapis.com/auth/calendar',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    }),
  ).toString('base64url')

  const { createSign } = await import('node:crypto')
  const signer = createSign('RSA-SHA256')
  signer.update(`${header}.${claim}`)
  const signature = signer.sign(key, 'base64url')
  const assertion = `${header}.${claim}.${signature}`

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  })
  if (!res.ok) {
    console.error('google token error', await res.text())
    return null
  }
  const data = (await res.json()) as { access_token?: string }
  return data.access_token ?? null
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' })

  const calendarId = process.env.GOOGLE_CALENDAR_ID
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!calendarId || !supabaseUrl || !serviceKey) {
    return json(503, { error: 'not_configured' })
  }

  const token = await getAccessToken()
  if (!token) return json(503, { error: 'google_auth_failed' })

  const body = (await req.json()) as {
    action: 'upsert' | 'delete'
    item: {
      id: string
      list_id: string
      text: string
      due_at: string | null
      note?: string | null
    }
  }

  if (!body.item?.id || !body.item.list_id) {
    return json(400, { error: 'invalid_body' })
  }

  const supabase = createClient(supabaseUrl, serviceKey)
  const { data: existing } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('item_id', body.item.id)
    .maybeSingle()

  if (body.action === 'delete' || !body.item.due_at) {
    if (existing?.external_event_id) {
      await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(existing.external_event_id)}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        },
      )
      await supabase.from('calendar_events').delete().eq('id', existing.id)
    }
    return json(200, { ok: true, deleted: true })
  }

  const start = new Date(body.item.due_at)
  const end = new Date(start.getTime() + 60 * 60 * 1000)
  const eventBody = {
    summary: body.item.text,
    description: body.item.note ?? 'Home OS',
    start: { dateTime: start.toISOString() },
    end: { dateTime: end.toISOString() },
  }

  let externalId = existing?.external_event_id as string | undefined
  if (externalId) {
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(externalId)}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventBody),
      },
    )
    if (!res.ok) console.error('calendar patch', await res.text())
  } else {
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventBody),
      },
    )
    if (res.ok) {
      const created = (await res.json()) as { id?: string }
      externalId = created.id
      await supabase.from('calendar_events').insert({
        list_id: body.item.list_id,
        item_id: body.item.id,
        external_event_id: externalId,
        title: body.item.text,
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
        raw: created,
      })
    } else {
      console.error('calendar create', await res.text())
    }
  }

  return json(200, { ok: true, external_event_id: externalId ?? null })
}
