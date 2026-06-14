import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkAndUnlockBadges } from '@/lib/check-badges'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id')

  let processed = 0
  for (const profile of profiles ?? []) {
    await checkAndUnlockBadges(supabase, profile.id)
    processed++
  }

  return NextResponse.json({ processed })
}
