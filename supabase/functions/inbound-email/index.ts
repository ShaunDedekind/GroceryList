import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Inbound email webhook stub for Henry document capture.
 *
 * Expected JSON body:
 * {
 *   "list_code": "ABC123",
 *   "from": "sender@example.com",
 *   "subject": "Immunisation record",
 *   "text": "optional body",
 *   "attachments": [{ "filename": "record.pdf", "mime_type": "application/pdf", "content_base64"?: "...", "url"?: "..." }]
 * }
 *
 * Storage path convention (TODO upload): {list_id}/{document_id}/{filename}
 * Bucket: list-documents
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: 'Server configuration error' }, 500)
  }

  let body: {
    list_code?: string
    from?: string
    subject?: string
    text?: string
    attachments?: unknown[]
  }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  const listCode = body.list_code?.toUpperCase().trim()
  if (!listCode) {
    return json({ error: 'list_code required' }, 400)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const { data: list, error: listError } = await supabase
    .from('lists')
    .select('id, code')
    .eq('code', listCode)
    .maybeSingle()

  if (listError) {
    return json({ error: listError.message }, 500)
  }
  if (!list) {
    return json({ error: 'List not found' }, 404)
  }

  const { data: emailRow, error: insertError } = await supabase
    .from('inbound_emails')
    .insert({
      list_id: list.id,
      from_address: body.from ?? null,
      subject: body.subject ?? null,
      body_text: body.text ?? null,
      status: 'received',
      raw_payload: body,
    })
    .select('id')
    .single()

  if (insertError) {
    return json({ error: insertError.message }, 500)
  }

  // TODO: For each attachment, upload to storage bucket `list-documents`
  // at `{list_id}/{document_id}/{filename}` and insert into `documents`.

  return json({
    ok: true,
    id: emailRow.id,
    list_id: list.id,
    attachments_queued: Array.isArray(body.attachments)
      ? body.attachments.length
      : 0,
  })
})

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}
