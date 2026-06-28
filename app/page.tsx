import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OnboardingClient from '@/components/OnboardingClient'

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [specialRes, deadlineRes] = await Promise.all([
      (supabase as any)
        .from('special_predictions')
        .select('champion_team, top_scorer')
        .eq('user_id', user.id)
        .maybeSingle(),
      (supabase as any)
        .from('predictions')
        .select('deadline')
        .eq('category', 'especial')
        .limit(1)
        .maybeSingle(),
    ])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const special = (specialRes as any).data
    if (special?.champion_team && special?.top_scorer) redirect('/home')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const especialDeadline = (deadlineRes as any).data?.deadline
    if (especialDeadline && Date.now() > new Date(especialDeadline).getTime()) redirect('/home')
  }

  return <OnboardingClient userId={user?.id ?? null} joinCode={null} />
}
