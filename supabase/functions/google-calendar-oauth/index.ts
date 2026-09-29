/**
 * Google Calendar OAuth stub.
 *
 * Required env when wired live:
 * - GOOGLE_CLIENT_ID
 * - GOOGLE_CLIENT_SECRET
 * - GOOGLE_REDIRECT_URI
 *
 * Will eventually create/update `calendar_connections` for the list and
 * return an authUrl for the client to open.
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

  const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
  if (!clientId) {
    return json({
      status: 'not_configured',
      authUrl: null,
      message:
        'Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI to enable Calendar OAuth.',
    })
  }

  // Live OAuth URL construction lands in a later pass.
  return json({
    status: 'not_configured',
    authUrl: null,
    message: 'OAuth scaffold present; token exchange not implemented yet.',
  })
})

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}
