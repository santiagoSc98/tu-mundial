import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OnboardingClient from '@/components/OnboardingClient'

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Deadline fijo: predicciones especiales cerraron antes del inicio del Mundial
  const SPECIAL_CLOSED = Date.now() > new Date('2026-06-11T00:00:00-04:00').getTime()

  if (user) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: special } = await (supabase as any)
      .from('special_predictions')
      .select('champion_team, top_scorer')
      .eq('user_id', user.id)
      .maybeSingle()

    if (special?.champion_team && special?.top_scorer) redirect('/home')
    if (SPECIAL_CLOSED) redirect('/home')
  }

  return <OnboardingClient userId={user?.id ?? null} joinCode={null} />
}
