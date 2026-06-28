import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== 'santiagocampuzano68@gmail.com') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { heading, message, url, segment } = await req.json()

  console.log('[notifications] ONESIGNAL_REST_API_KEY exists:', !!process.env.ONESIGNAL_REST_API_KEY)
  console.log('[notifications] key prefix:', process.env.ONESIGNAL_REST_API_KEY?.substring(0, 20))

  const response = await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Basic ${process.env.ONESIGNAL_REST_API_KEY}`,
    },
    body: JSON.stringify({
      app_id:            '11c43fd4-40b2-48f3-b460-4bfcadce9213',
      headings:          { en: heading, es: heading },
      contents:          { en: message, es: message },
      url:               url || 'https://tu-mundial.vercel.app/home',
      included_segments: [segment || 'All'],
    }),
  })

  const data = await response.json()
  console.log('[notifications] OneSignal status:', response.status, '| response:', data)
  return NextResponse.json(data, { status: response.ok ? 200 : 500 })
}
