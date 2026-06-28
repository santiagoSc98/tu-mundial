import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

async function sendOneSignal(heading: string, content: string) {
  return fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Basic ${process.env.ONESIGNAL_REST_API_KEY}`,
    },
    body: JSON.stringify({
      app_id:            '11c43fd4-40b2-48f3-b460-4bfcadce9213',
      headings:          { es: heading, en: heading },
      contents:          { es: content, en: content },
      url:               'https://tu-mundial.vercel.app/home',
      included_segments: ['All'],
    }),
  })
}

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabase()
  const now  = new Date()
  const in30 = new Date(now.getTime() + 30 * 60 * 1000)
  const in35 = new Date(now.getTime() + 35 * 60 * 1000)

  const { data: predictions } = await supabase
    .from('predictions')
    .select('id, title, deadline')
    .eq('status', 'open')
    .gte('deadline', in30.toISOString())
    .lte('deadline', in35.toISOString())

  if (!predictions?.length) {
    return NextResponse.json({ sent: 0 })
  }

  let sent = 0
  for (const pred of predictions) {
    const title = (pred.title as string).replace(' - Mundial 2026', '')
    const res = await sendOneSignal('⏰ ¡Cerrando pronto!', `Faltan 30 min para cerrar: ${title}`)
    console.log(`[notify-upcoming] sent for "${title}":`, res.status)
    sent++
  }

  return NextResponse.json({ sent })
}
