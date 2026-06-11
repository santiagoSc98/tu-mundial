'use server'

import { createClient } from '@/lib/supabase/server'

export async function updateProfile({
  username,
  country,
  avatarBase64,
  avatarType,
}: {
  username: string
  country: string
  avatarBase64?: string
  avatarType?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'No autenticado' }

  let avatarUrl: string | undefined

  if (avatarBase64 && avatarType) {
    const buffer = Buffer.from(avatarBase64, 'base64')
    const fileName = `${user.id}/${Date.now()}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, buffer, { contentType: avatarType, upsert: true })

    if (uploadError) {
      console.error('[Avatar] upload error:', uploadError)
    } else {
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(uploadData.path)
      avatarUrl = urlData.publicUrl
    }
  }

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
