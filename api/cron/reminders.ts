import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

export const config = { runtime: 'nodejs' }

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function addDays(d: Date, n: number) {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

export default async function handler(req: Request): Promise<Response> {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && req.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return json(401, { error: 'unauthorized' })
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const vapidPublic = process.env.VAPID_PUBLIC_KEY
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY
  const vapidSubject =
    process.env.VAPID_SUBJECT ?? 'mailto:shaundedekind@gmail.com'

  if (!supabaseUrl || !serviceKey) return json(503, { error: 'not_configured' })

  if (vapidPublic && vapidPrivate) {
    webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate)
  }

  const supabase = createClient(supabaseUrl, serviceKey)
  const now = new Date()
  const today = startOfDay(now)
  const in3 = addDays(today, 3)
  const tomorrow = addDays(today, 1)

  const { data: items } = await supabase
    .from('items')
    .select('*')
    .eq('checked', false)
    .not('due_at', 'is', null)

  const messages: { list_id: string; title: string; body: string }[] = []

  for (const item of items ?? []) {
    const due = new Date(item.due_at)
    if (Number.isNaN(due.getTime())) continue
    const dueDay = startOfDay(due)

    const isBill = item.item_kind === 'bill' || item.category === 'bills'
    const isSession =
      item.item_kind === 'session' || item.category === 'activities'

    if (isBill && dueDay.getTime() === in3.getTime()) {
      messages.push({
        list_id: item.list_id,
        title: 'Bill due in 3 days',
        body: item.text,
      })
    }
    if (isBill && dueDay.getTime() === today.getTime()) {
      messages.push({
        list_id: item.list_id,
        title: 'Bill due today',
        body: item.text,
      })
    }
    if (isSession && dueDay.getTime() === tomorrow.getTime()) {
      messages.push({
        list_id: item.list_id,
        title: 'Tomorrow',
        body: item.text,
      })
    }
    if (
      (item.item_kind === 'maintenance' || item.category === 'maintenance') &&
      dueDay < today &&
      now.getDay() === 1
    ) {
      messages.push({
        list_id: item.list_id,
        title: 'Overdue maintenance',
        body: item.text,
      })
    }
  }

  let sent = 0
  if (vapidPublic && vapidPrivate) {
    for (const msg of messages) {
      const { data: subs } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('list_id', msg.list_id)

      for (const sub of subs ?? []) {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            JSON.stringify({ title: msg.title, body: msg.body }),
          )
          sent++
        } catch (error) {
          console.error('push failed', error)
        }
      }
    }
  }

  return json(200, { ok: true, candidates: messages.length, sent })
}
