import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

function getSupabase() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )
}

const DELAY_MS = 6200 // football-data.org free tier: 10 req/min

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchMatchResult(fixtureId: string): Promise<{
  finished: boolean
  homeScore: number
  awayScore: number
} | null> {
  try {
    const res = await fetch(
      `https://api.football-data.org/v4/matches/${fixtureId}`,
      {
        headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY! },
        cache: 'no-store',
      }
    )
    if (!res.ok) {
      console.error(`[resolve-matches] API ${res.status} for fixture ${fixtureId}`)
      return null
    }
    const data = await res.json()
    const match = data.match ?? data
    if (match.status !== 'FINISHED') return { finished: false, homeScore: 0, awayScore: 0 }
    return {
      finished: true,
      homeScore: match.score?.fullTime?.home ?? 0,
      awayScore: match.score?.fullTime?.away ?? 0,
    }
  } catch (err) {
    console.error(`[resolve-matches] fetch error for fixture ${fixtureId}:`, err)
    return null
  }
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const isVercelCron = authHeader === `Bearer ${process.env.CRON_SECRET}`
  if (!isVercelCron) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabase()

  const now = new Date().toISOString()

  // Fetch unresolved predictions with a fixture_id whose deadline has passed
  const { data: predictions, error: predError } = await supabase
    .from('predictions')
    .select('*')
    .in('status', ['open', 'closed'])
    .not('fixture_id', 'is', null)
    .lt('deadline', now)

  if (predError) {
    console.error('[resolve-matches] fetch predictions error:', predError)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  const checked = predictions?.length ?? 0
  let resolved = 0
  let usersAwarded = 0
  const details: { fixtureId: string; result: string; users: number }[] = []
  const affectedUserIds = new Set<string>()

  for (let i = 0; i < (predictions ?? []).length; i++) {
    const pred = predictions![i]
    const opts = Array.isArray(pred.options) ? (pred.options as string[]) : []
    const homeOpt = opts[0] ?? ''
    const drawOpt = opts[1] ?? 'Empate'
    const awayOpt = opts[2] ?? ''

    console.log(`[resolve-matches] checking fixture ${pred.fixture_id} (${homeOpt} vs ${awayOpt})`)

    if (i > 0) await sleep(DELAY_MS)

    const result = await fetchMatchResult(pred.fixture_id!)
    if (!result || !result.finished) {
      console.log(`[resolve-matches] fixture ${pred.fixture_id} not finished, skipping`)
      continue
    }

    // Use stored option names to guarantee answer matches user votes
    let correctAnswer: string
    if (result.homeScore > result.awayScore) correctAnswer = homeOpt
    else if (result.awayScore > result.homeScore) correctAnswer = awayOpt
    else correctAnswer = drawOpt

    // Mark prediction resolved
    const { error: updatePredError } = await supabase
      .from('predictions')
      .update({ correct_answer: correctAnswer, status: 'resolved', auto_resolved: true })
      .eq('id', pred.id)

    if (updatePredError) {
      console.error(`[resolve-matches] update prediction ${pred.id}:`, updatePredError)
      continue
    }

    // Fetch all user votes for this prediction
    const { data: userPreds } = await supabase
      .from('user_predictions')
      .select('*')
      .eq('prediction_id', pred.id)

    let matchUsersAwarded = 0

    if (userPreds?.length) {
      await Promise.all(userPreds.map(async (up) => {
        const isCorrect = up.predicted_answer === correctAnswer
        let pointsEarned = 0
        if (isCorrect) pointsEarned += 3
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const upAny = up as any
        if (
          upAny.home_score_prediction !== null && upAny.home_score_prediction !== undefined &&
          upAny.away_score_prediction !== null && upAny.away_score_prediction !== undefined &&
          upAny.home_score_prediction === result.homeScore &&
          upAny.away_score_prediction === result.awayScore
        ) {
          pointsEarned += 5
        }

        await supabase
          .from('user_predictions')
          .update({ is_correct: isCorrect, points_earned: pointsEarned })
          .eq('id', up.id)

        const { data: profile } = await supabase
          .from('profiles')
          .select('total_points')
          .eq('id', up.user_id)
          .single()

        if (profile) {
          await supabase
            .from('profiles')
            .update({ total_points: profile.total_points + pointsEarned })
            .eq('id', up.user_id)
          affectedUserIds.add(up.user_id)
          if (isCorrect) matchUsersAwarded++
        }
      }))
    }

    resolved++
    usersAwarded += matchUsersAwarded
    details.push({
      fixtureId: pred.fixture_id!,
      result: `${homeOpt} ${result.homeScore}–${result.awayScore} ${awayOpt} → ${correctAnswer}`,
      users: matchUsersAwarded,
    })

    console.log(`[resolve-matches] resolved fixture ${pred.fixture_id}: ${correctAnswer}, ${matchUsersAwarded} users awarded`)
  }

  // Recalculate streaks for all affected users from scratch
  for (const uid of affectedUserIds) {
    const { data: userVotes } = await supabase
      .from('user_predictions')
      .select('is_correct, created_at')
      .eq('user_id', uid)
      .not('is_correct', 'is', null)
      .order('created_at', { ascending: false })

    let streak = 0
    for (const v of (userVotes ?? [])) {
      if (v.is_correct) streak++
      else break
    }

    await supabase
      .from('profiles')
      .update({ current_streak: streak })
      .eq('id', uid)
  }

  return NextResponse.json({ checked, resolved, usersAwarded, details })
}
