import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tu-mundial.vercel.app'

  const response = await fetch(`${baseUrl}/api/cron/resolve-matches`, {
    headers: {
      Authorization: `Bearer ${process.env.CRON_SECRET}`,
    },
  })

  const data = await response.json()
  return NextResponse.json(data)
}
