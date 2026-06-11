import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OnboardingClient from '@/components/OnboardingClient'

export default async function RootPage({
  searchParams,
}: {
  searchParams: { join?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const joinCode = searchParams.join && searchParams.join !== 'undefined'
    ? searchParams.join
    : null

  if (user) {
    redirect(joinCode ? `/home?join=${joinCode}` : '/home')
  }

  return <OnboardingClient userId={null} joinCode={joinCode} />
}
