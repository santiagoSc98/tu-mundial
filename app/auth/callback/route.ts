import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.exchangeCodeForSession(code)

    if (user) {
      const { data: special } = await supabase
        .from('special_predictions' as never)
        .select('champion_team, top_scorer')
        .eq('user_id', user.id)
        .maybeSingle() as { data: { champion_team: string | null; top_scorer: string | null } | null }

      if (special?.champion_team && special?.top_scorer) {
        return NextResponse.redirect(new URL('/home', origin))
      }
    }
  }

  return NextResponse.redirect(new URL('/', origin))
}
