'use server'

import { createClient } from '@/lib/supabase/server'

export async function savePrediction({
  predictionId,
  answer,
  homeScore,
  awayScore,
}: {
  predictionId: string
  answer: string
  homeScore: number | null
  awayScore: number | null
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'No autenticado' }
  }

  const { data: pred } = await supabase
    .from('predictions')
    .select('deadline')
    .eq('id', predictionId)
    .single()

  if (!pred) return { data: null, error: 'Partido no encontrado' }
  if (new Date() > new Date(pred.deadline ?? 0)) {
    return { data: null, error: 'El tiempo para predecir ya cerró' }
  }

  const { data, error } = await supabase
    .from('user_predictions')
    .upsert({
      user_id:               user.id,
      prediction_id:         predictionId,
      predicted_answer:      answer,
      home_score_prediction: homeScore,
      away_score_prediction: awayScore,
      confidence_level:      50,
    }, { onConflict: 'user_id,prediction_id' })
    .select()
    .single()

  if (error) {
    console.error('[savePrediction] error:', error)
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

export async function saveSpecialPredictions({
  championTeam,
  topScorer,
}: {
  championTeam: string | null
  topScorer: string | null
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('special_predictions')
    .upsert(
      { user_id: user.id, champion_team: championTeam, top_scorer: topScorer },
      { onConflict: 'user_id' }
    )

  if (error) {
    console.error('[saveSpecialPredictions] error:', error)
    return { error: error.message as string }
  }

  return { error: null }
}

export async function getAllPredictionsForMatch({
  predictionId,
  groupId,
}: {
  predictionId: string
  groupId?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: prediction } = await (supabase as any)
    .from('predictions')
    .select('status, exact_score_home, exact_score_away, correct_answer')
    .eq('id', predictionId)
    .single()

  if (prediction?.status !== 'resolved') {
    return { error: 'El partido todavía no terminó' }
  }

  // If groupId provided, restrict to group members only
  let userIds: string[] | null = null
  if (groupId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: members } = await (supabase as any)
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId)
    userIds = (members ?? []).map((m: { user_id: string }) => m.user_id)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let profilesQuery = (supabase as any)
    .from('profiles')
    .select('id, username, avatar_url')
  if (userIds) profilesQuery = profilesQuery.in('id', userIds)

  const { data: profiles } = await profilesQuery

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let votesQuery = (supabase as any)
    .from('user_predictions')
    .select('user_id, home_score_prediction, away_score_prediction, predicted_answer, is_correct, points_earned')
    .eq('prediction_id', predictionId)
  if (userIds) votesQuery = votesQuery.in('user_id', userIds)

  const { data: votes } = await votesQuery

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = (profiles ?? []).map((profile: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vote = (votes ?? []).find((v: any) => v.user_id === profile.id)
    return {
      user:         profile as { id: string; username: string | null; avatar_url: string | null },
      isMe:         profile.id === user?.id,
      homeScore:    vote?.home_score_prediction ?? null,
      awayScore:    vote?.away_score_prediction ?? null,
      isCorrect:    vote?.is_correct    ?? null,
      pointsEarned: vote?.points_earned ?? null,
      hasPredicted: !!vote,
    }
  })

  result.sort((a: typeof result[0], b: typeof result[0]) => {
    if (a.isMe && !b.isMe) return -1
    if (!a.isMe && b.isMe) return 1
    if (!a.hasPredicted && b.hasPredicted) return 1
    if (a.hasPredicted && !b.hasPredicted) return -1
    return ((b.pointsEarned ?? -1) as number) - ((a.pointsEarned ?? -1) as number)
  })

  const totalWithPrediction = result.filter((r: typeof result[0]) => r.hasPredicted).length
  const totalCorrect        = result.filter((r: typeof result[0]) => r.isCorrect).length
  const accuracy = totalWithPrediction > 0
    ? Math.round((totalCorrect / totalWithPrediction) * 100)
    : 0

  return {
    data: result,
    stats: { total: result.length, totalCorrect, totalWithPrediction, accuracy },
    prediction,
  }
}
