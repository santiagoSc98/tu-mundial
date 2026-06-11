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
