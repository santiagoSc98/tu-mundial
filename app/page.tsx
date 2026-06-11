import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OnboardingClient from '@/components/OnboardingClient'

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: special } = await supabase
      .from('special_predictions' as never)
      .select('champion_team, top_scorer')
      .eq('user_id', user.id)
      .maybeSingle() as { data: { champion_team: string | null; top_scorer: string | null } | null }

    if (special?.champion_team && special?.top_scorer) redirect('/home')
  }

  return <OnboardingClient userId={user?.id ?? null} joinCode={null} />
}
