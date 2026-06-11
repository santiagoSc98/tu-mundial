'use server'

import { createClient } from '@/lib/supabase/server'

export async function updateProfile({
  username,
  country,
  avatarUrl,
}: {
  username: string
  country: string
  avatarUrl?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'No autenticado' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: any = { username, country }
  if (avatarUrl) updateData.avatar_url = avatarUrl

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('profiles')
    .update(updateData)
    .eq('id', user.id)
    .select()
    .single()

  if (error) return { data: null, error: error.message as string }
  return { data, error: null }
}
