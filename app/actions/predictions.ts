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

  const { data, error } = await supabase
    .from('user_predictions')
    .insert({
      user_id:               user.id,
      prediction_id:         predictionId,
      predicted_answer:      answer,
      home_score_prediction: homeScore,
      away_score_prediction: awayScore,
      confidence_level:      50,
    })
    .select()
    .single()

  if (error) {
    console.error('[savePrediction] error:', error)
    return { data: null, error: error.message }
  }

  return { data, error: null }
}
