import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== 'santiagocampuzano68@gmail.com') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { heading, message, url, userIds } = await req.json()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body: Record<string, any> = {
    app_id:   '11c43fd4-40b2-48f3-b460-4bfcadce9213',
    headings: { en: heading },
    contents: { en: message },
    url:      url || 'https://tu-mundial.vercel.app/home',
  }

  if (userIds?.length) {
    body.include_external_user_ids = userIds
  } else {
    body.included_segments = ['All']
  }

  const response = await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Basic ${process.env.ONESIGNAL_REST_API_KEY}`,
    },
    body: JSON.stringify(body),
  })

  const data = await response.json()
  return NextResponse.json(data, { status: response.ok ? 200 : 500 })
}
