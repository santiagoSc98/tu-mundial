'use server'

import { createClient } from '@/lib/supabase/server'

export async function createGroup(
  name: string,
  prizeAmount?: number | null,
  entryFee?: number | null,
  currency: string = 'Gs',
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'No autenticado' }

  const code = name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 4)
    .padEnd(4, 'X') + Math.random().toString(36).slice(2, 5).toUpperCase()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: group, error } = await (supabase as any)
    .from('groups')
    .insert({
      name, code, created_by: user.id,
      prize_amount: prizeAmount ?? null,
      entry_fee:    entryFee    ?? null,
      currency,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message as string }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('group_members')
    .insert({ group_id: group.id, user_id: user.id })

  return { data: group as { id: string; name: string; code: string; created_by: string; prize_amount: number | null; entry_fee: number | null; currency: string }, error: null }
}

export async function joinGroup(code: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'No autenticado' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: group } = await (supabase as any)
    .from('groups')
    .select('id, name, code, created_by')
    .eq('code', code.trim().toUpperCase())
    .single()

  if (!group) return { data: null, error: 'Código inválido' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from('group_members')
    .select('user_id')
    .eq('group_id', group.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) return { data: null, error: 'Ya sos miembro de este grupo' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('group_members')
    .insert({ group_id: group.id, user_id: user.id })

  return { data: group as { id: string; name: string; code: string; created_by: string }, error: null }
}

export async function updateGroup({
  groupId,
  name,
  prizeAmount,
  entryFee,
  currency,
}: {
  groupId: string
  name: string
  prizeAmount: number | null
  entryFee: number | null
  currency: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  console.log('[updateGroup] userId:', user?.id)
  console.log('[updateGroup] groupId:', groupId)
  console.log('[updateGroup] data:', { name, prizeAmount, entryFee, currency })

  if (!user) return { error: 'No autenticado' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: group } = await (supabase as any)
    .from('groups')
    .select('created_by')
    .eq('id', groupId)
    .single()

  console.log('[updateGroup] group.created_by:', group?.created_by)
  console.log('[updateGroup] match:', group?.created_by === user.id)

  if (group?.created_by !== user.id) return { error: 'Solo el creador puede editar el grupo' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('groups')
    .update({ name, prize_amount: prizeAmount, entry_fee: entryFee, currency })
    .eq('id', groupId)
    .select()

  console.log('[updateGroup] result:', { data, error })

  if (error) return { error: error.message as string, success: false }
  return { error: null, success: true }
}

export async function getGroupMembers(groupId: string) {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('group_members')
    .select('user_id, profiles(id, username, avatar_url, total_points)')
    .eq('group_id', groupId)

  if (error) return { data: null, error: error.message as string }
  return { data: data as { user_id: string; profiles: { id: string; username: string | null; avatar_url: string | null; total_points: number } | null }[], error: null }
}
