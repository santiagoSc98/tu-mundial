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

  console.log('[updateGroup] data:', data, 'error:', error)

  if (error) return { data: null, error: error.message as string }
  return { data: data[0] as { id: string; name: string; code: string; created_by: string; prize_amount: number | null; entry_fee: number | null; currency: string }, error: null }
}

export async function removeMember({
  groupId,
  memberId,
}: {
  groupId: string
  memberId: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: group } = await (supabase as any)
    .from('groups')
    .select('created_by')
    .eq('id', groupId)
    .single()

  if (group?.created_by !== user.id) return { error: 'Solo el creador puede eliminar miembros' }
  if (memberId === user.id) return { error: 'No podés eliminarte a vos mismo' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', memberId)

  if (error) return { error: error.message as string }
  return { success: true }
}

export async function setupGroupPhases({
  groupId,
  phases,
}: {
  groupId: string
  phases: { phase: string; entry_fee: number; currency: string }[]
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: group } = await (supabase as any)
    .from('groups').select('created_by').eq('id', groupId).single()

  if (group?.created_by !== user.id) return { error: 'Solo el creador puede configurar fases' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: deleteError } = await (supabase as any)
    .from('group_phases').delete().eq('group_id', groupId)

  if (deleteError) return { data: null, error: 'Error al limpiar fases: ' + deleteError.message }

  await new Promise(resolve => setTimeout(resolve, 200))

  const PHASE_ORDER_INSERT = ['grupos', 'dieciseisavos', 'octavos', 'cuartos', 'semis', 'final']
  const sorted = [...phases].sort(
    (a, b) => PHASE_ORDER_INSERT.indexOf(a.phase) - PHASE_ORDER_INSERT.indexOf(b.phase)
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('group_phases')
    .insert(sorted.map(p => ({
      group_id: groupId,
      phase: p.phase,
      entry_fee: p.entry_fee,
      currency: p.currency,
      status: p.phase === 'grupos' ? 'active' : 'upcoming',
    })))
    .select()

  if (error) return { data: null, error: error.message as string }
  return { data, error: null }
}

export async function markPhasePaid({
  phaseId,
  userId: targetUserId,
}: {
  phaseId: string
  userId: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: phase } = await (supabase as any)
    .from('group_phases').select('group_id').eq('id', phaseId).single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: group } = await (supabase as any)
    .from('groups').select('created_by').eq('id', phase?.group_id).single()

  const isCreator = group?.created_by === user.id
  const isSelf    = user.id === targetUserId
  if (!isCreator && !isSelf) return { error: 'No tenés permiso para marcar este pago' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('group_phase_payments')
    .upsert({ phase_id: phaseId, user_id: targetUserId }, { onConflict: 'phase_id,user_id' })
    .select()

  if (error) return { data: null, error: error.message as string }
  return { data, error: null }
}

export async function markPhaseUnpaid({
  phaseId,
  userId: targetUserId,
}: {
  phaseId: string
  userId: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: phase } = await (supabase as any)
    .from('group_phases').select('group_id').eq('id', phaseId).single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: group } = await (supabase as any)
    .from('groups').select('created_by').eq('id', phase?.group_id).single()

  const isCreator = group?.created_by === user.id
  const isSelf    = user.id === targetUserId
  if (!isCreator && !isSelf) return { error: 'No tenés permiso para modificar este pago' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('group_phase_payments')
    .delete()
    .eq('phase_id', phaseId)
    .eq('user_id', targetUserId)

  if (error) return { error: error.message as string }
  return { success: true }
}

export async function setPhaseWinner({
  phaseId,
  winnerId,
}: {
  phaseId: string
  winnerId: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: phase } = await (supabase as any)
    .from('group_phases').select('group_id').eq('id', phaseId).single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: group } = await (supabase as any)
    .from('groups').select('created_by').eq('id', phase?.group_id).single()

  if (group?.created_by !== user.id) return { error: 'Solo el creador puede declarar ganador' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('group_phases')
    .update({ winner_id: winnerId, status: 'closed' })
    .eq('id', phaseId)
    .select()
    .single()

  if (error) return { data: null, error: error.message as string }
  return { data, error: null }
}

export type GroupPhase = {
  id: string
  group_id: string
  phase: string
  entry_fee: number
  currency: string
  status: 'active' | 'upcoming' | 'closed'
  winner_id: string | null
  created_at: string
  payments: { user_id: string }[]
}

export async function getPhaseWinner({ groupId, phase }: { groupId: string; phase: string }) {
  const supabase = await createClient()

  const PHASE_STAGES: Record<string, string> = {
    grupos:         'GROUP_STAGE',
    dieciseisavos: 'LAST_32',
    octavos:        'LAST_16',
    cuartos:        'QUARTER_FINALS',
    semis:          'SEMI_FINALS',
    final:          'FINAL',
  }
  const stageKey = PHASE_STAGES[phase]
  if (!stageKey) return { data: null, error: 'Fase inválida' }

  const { data: predictions } = await supabase
    .from('predictions')
    .select('id')
    .ilike('description', `%${stageKey}%`)
    .eq('status', 'resolved')

  if (!predictions?.length) return { data: null, error: 'No hay partidos resueltos en esta fase' }

  const predictionIds = predictions.map(p => p.id)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: members } = await (supabase as any)
    .from('group_members')
    .select('user_id, profiles(id, username, avatar_url)')
    .eq('group_id', groupId)

  if (!members?.length) return { data: null, error: 'No hay miembros' }

  const userIds = (members as { user_id: string }[]).map(m => m.user_id)

  const { data: votes } = await supabase
    .from('user_predictions')
    .select('user_id, points_earned')
    .in('prediction_id', predictionIds)
    .in('user_id', userIds)

  const totals: Record<string, number> = {}
  for (const vote of votes ?? []) {
    totals[vote.user_id] = (totals[vote.user_id] ?? 0) + ((vote.points_earned as number | null) ?? 0)
  }

  let winnerId = ''
  let maxPts = -1
  for (const [uid, pts] of Object.entries(totals)) {
    if (pts > maxPts) { maxPts = pts; winnerId = uid }
  }

  if (!winnerId) return { data: null, error: 'No hay predicciones en esta fase aún' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const winnerMember = (members as any[]).find(m => m.user_id === winnerId)
  return {
    data: {
      winner: winnerMember?.profiles as { id: string; username: string | null; avatar_url: string | null } | null,
      points: maxPts,
    },
    error: null,
  }
}

export async function getGroupPhases(groupId: string) {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('group_phases')
    .select('*, payments:group_phase_payments(user_id)')
    .eq('group_id', groupId)
    .order('created_at')

  if (error) return { data: null, error: error.message as string }

  const PHASE_ORDER = ['grupos', 'dieciseisavos', 'octavos', 'cuartos', 'semis', 'final']
  const sorted = (data as GroupPhase[]).sort(
    (a, b) => PHASE_ORDER.indexOf(a.phase) - PHASE_ORDER.indexOf(b.phase)
  )
  return { data: sorted, error: null }
}

export async function getGroupPredictionsForMatch({
  groupId,
  predictionId,
}: {
  groupId: string
  predictionId: string
}) {
  const supabase = await createClient()

  // Only show after the match is resolved
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: pred } = await (supabase as any)
    .from('predictions')
    .select('status, exact_score_home, exact_score_away')
    .eq('id', predictionId)
    .single()

  if (pred?.status !== 'resolved') {
    return { error: 'El partido todavía no terminó' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: members } = await (supabase as any)
    .from('group_members')
    .select('user_id, profiles(id, username, avatar_url)')
    .eq('group_id', groupId)

  if (!members) return { data: [] }

  const userIds = (members as { user_id: string }[]).map(m => m.user_id)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: votes } = await (supabase as any)
    .from('user_predictions')
    .select('user_id, home_score_prediction, away_score_prediction, is_correct, points_earned')
    .eq('prediction_id', predictionId)
    .in('user_id', userIds)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = (members as any[]).map((member: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vote = (votes as any[])?.find((v: any) => v.user_id === member.user_id)
    return {
      user: member.profiles as { id: string; username: string | null; avatar_url: string | null },
      homeScore:    vote?.home_score_prediction ?? null,
      awayScore:    vote?.away_score_prediction ?? null,
      isCorrect:    vote?.is_correct    ?? null,
      pointsEarned: vote?.points_earned ?? null,
      hasPredicted: !!vote,
    }
  })

  result.sort((a: { pointsEarned: number | null }, b: { pointsEarned: number | null }) =>
    (b.pointsEarned ?? -1) - (a.pointsEarned ?? -1)
  )

  return { data: result }
}

export async function getGroupMembers(groupId: string) {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('group_members')
    .select('user_id, profiles(id, username, avatar_url, total_points, current_streak)')
    .eq('group_id', groupId)

  if (error) return { data: null, error: error.message as string }

  const memberIds: string[] = (data ?? []).map((m: { user_id: string }) => m.user_id)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: predRows } = await (supabase as any)
    .from('user_predictions')
    .select('user_id')
    .in('user_id', memberIds.length > 0 ? memberIds : ['00000000-0000-0000-0000-000000000000'])

  const predCountMap: Record<string, number> = {}
  for (const row of (predRows ?? []) as { user_id: string }[]) {
    predCountMap[row.user_id] = (predCountMap[row.user_id] ?? 0) + 1
  }

  type MemberRow = {
    user_id: string
    profiles: { id: string; username: string | null; avatar_url: string | null; total_points: number; current_streak: number } | null
    totalPredictions: number
  }

  return {
    data: ((data ?? []) as Omit<MemberRow, 'totalPredictions'>[]).map(m => ({
      ...m,
      totalPredictions: predCountMap[m.user_id] ?? 0,
    })) as MemberRow[],
    error: null,
  }
}
