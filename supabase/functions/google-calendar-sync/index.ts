/**
 * Google Calendar sync stub.
 *
 * When live, this will:
 * 1. Load `calendar_connections` for the list
 * 2. Fetch events from Google Calendar API
 * 3. Upsert into `calendar_events`
 * 4. Optionally create/update Henry `items` with due_at from starts_at
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-list-code',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  return json({
    status: 'not_configured',
    synced: 0,
    message:
      'Calendar sync scaffold ready. Wire OAuth tokens then upsert calendar_events / Henry items.',
  })
})

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}
