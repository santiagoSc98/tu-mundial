import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const normalize = (str: string) =>
  (str ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: resolvedPreds } = await (supabase as any)
    .from('predictions')
    .select('id, correct_answer, exact_score_home, exact_score_away, difficulty_multiplier, title')
    .eq('status', 'resolved')
    .not('exact_score_home', 'is', null)
    .not('correct_answer', 'is', null)

  let rescored = 0
  const affectedUsers = new Set<string>()

  for (const pred of (resolvedPreds ?? [])) {
    const home = pred.exact_score_home as number
    const away = pred.exact_score_away as number
    const resultPts = Math.round(3 * ((pred.difficulty_multiplier as number) || 1))
    const exactPts  = Math.round(8 * ((pred.difficulty_multiplier as number) || 1))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userPreds } = await (supabase as any)
      .from('user_predictions')
      .select('id, user_id, predicted_answer, home_score_prediction, away_score_prediction, is_correct, points_earned')
      .eq('prediction_id', pred.id)

    for (const up of (userPreds ?? [])) {
      const isCorrect = normalize(up.predicted_answer) === normalize(pred.correct_answer)
      const isExact   = isCorrect &&
        up.home_score_prediction != null &&
        up.away_score_prediction != null &&
        up.home_score_prediction === home &&
        up.away_score_prediction === away
      const points = isExact ? exactPts : isCorrect ? resultPts : 0

      if (up.is_correct !== isCorrect || up.points_earned !== points) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('user_predictions')
          .update({ is_correct: isCorrect, points_earned: points })
          .eq('id', up.id)

        rescored++
        affectedUsers.add(up.user_id)
        console.log(`[rescore-all] "${pred.title}" user=${up.user_id}: was(${up.is_correct},${up.points_earned}) → now(${isCorrect},${points})`)
      }
    }
  }

  // Recalculate total_points from scratch to avoid drift
  for (const userId of affectedUsers) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: allVotes } = await (supabase as any)
      .from('user_predictions')
      .select('points_earned')
      .eq('user_id', userId)

    const total = (allVotes ?? []).reduce(
      (sum: number, v: { points_earned: number | null }) => sum + (v.points_earned ?? 0),
      0,
    )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('profiles')
      .update({ total_points: total })
      .eq('id', userId)
  }

  return NextResponse.json({ rescored, usersAffected: affectedUsers.size })
}
