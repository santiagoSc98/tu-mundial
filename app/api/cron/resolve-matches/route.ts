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

const normalize = (str: string) =>
  (str ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchMatchResult(fixtureId: string): Promise<{
  finished: boolean
  homeScore: number | null
  awayScore: number | null
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
    if (match.status !== 'FINISHED') return { finished: false, homeScore: null, awayScore: null }
    return {
      finished: true,
      homeScore: match.score?.fullTime?.home ?? null,
      awayScore: match.score?.fullTime?.away ?? null,
    }
  } catch (err) {
    console.error(`[resolve-matches] fetch error for fixture ${fixtureId}:`, err)
    return null
  }
}

// Score all user_predictions for a prediction that is already resolved.
// Returns the number of users awarded points.
async function scoreUserPredictions(
  supabase: ReturnType<typeof getSupabase>,
  predId: string,
  correctAnswer: string,
  homeGoals: number,
  awayGoals: number,
  affectedUserIds: Set<string>,
): Promise<number> {
  const { data: userPreds, error: fetchErr } = await supabase
    .from('user_predictions')
    .select('*')
    .eq('prediction_id', predId)
    .is('is_correct', null) // only unscored rows

  if (fetchErr) {
    console.error(`[resolve-matches] fetch user_predictions for ${predId}:`, fetchErr)
    return 0
  }
  if (!userPreds?.length) return 0

  let awarded = 0

  for (const up of userPreds) {
    const isCorrect = normalize(up.predicted_answer) === normalize(correctAnswer)
    let pointsEarned = 0
    if (isCorrect) pointsEarned += 3

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const upAny = up as any
    if (
      upAny.home_score_prediction != null &&
      upAny.away_score_prediction != null &&
      upAny.home_score_prediction === homeGoals &&
      upAny.away_score_prediction === awayGoals
    ) {
      pointsEarned += 5
    }

    const { error: upErr } = await supabase
      .from('user_predictions')
      .update({ is_correct: isCorrect, points_earned: pointsEarned })
      .eq('id', up.id)

    if (upErr) {
      console.error(`[resolve-matches] update user_prediction ${up.id}:`, upErr)
      continue
    }

    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('total_points')
      .eq('id', up.user_id)
      .single()

    if (profileErr || !profile) {
      console.error(`[resolve-matches] fetch profile ${up.user_id}:`, profileErr)
      continue
    }

    const { error: profileUpErr } = await supabase
      .from('profiles')
      .update({ total_points: profile.total_points + pointsEarned })
      .eq('id', up.user_id)

    if (profileUpErr) {
      console.error(`[resolve-matches] update profile ${up.user_id}:`, profileUpErr)
      continue
    }

    affectedUserIds.add(up.user_id)
    if (isCorrect) awarded++
  }

  return awarded
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const isVercelCron = authHeader === `Bearer ${process.env.CRON_SECRET}`
  if (!isVercelCron) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabase()
  const now = new Date().toISOString()

  // ── Pass 1: resolve matches that finished but haven't been marked yet ─────────
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

    const homeGoals = result.homeScore
    const awayGoals = result.awayScore

    // FINISHED but score not yet populated — retry until 3h after deadline
    if (homeGoals === null || awayGoals === null) {
      const threeHoursAfterDeadline = new Date(pred.deadline).getTime() + 3 * 60 * 60 * 1000
      if (Date.now() >= threeHoursAfterDeadline) {
        console.error(`[resolve-matches] fixture ${pred.fixture_id} FINISHED but score still null after 3h — manual resolution needed`)
      } else {
        console.log(`[resolve-matches] fixture ${pred.fixture_id} FINISHED but score not yet available, will retry next run`)
      }
      continue
    }

    // Derive correct answer from opts[] (accented names) — never use raw API team name
    let correctAnswer: string
    if (homeGoals > awayGoals) correctAnswer = homeOpt
    else if (awayGoals > homeGoals) correctAnswer = awayOpt
    else correctAnswer = drawOpt

    // Mark prediction resolved and store exact scores
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updatePredError } = await (supabase.from('predictions') as any)
      .update({
        correct_answer: correctAnswer,
        status: 'resolved',
        auto_resolved: true,
        exact_score_home: homeGoals,
        exact_score_away: awayGoals,
      })
      .eq('id', pred.id)

    if (updatePredError) {
      console.error(`[resolve-matches] update prediction ${pred.id}:`, updatePredError)
      continue
    }

    // Score every user who voted on this prediction
    const matchUsersAwarded = await scoreUserPredictions(
      supabase, pred.id, correctAnswer, homeGoals, awayGoals, affectedUserIds
    )

    resolved++
    usersAwarded += matchUsersAwarded
    details.push({
      fixtureId: pred.fixture_id!,
      result: `${homeOpt} ${homeGoals}–${awayGoals} ${awayOpt} → ${correctAnswer}`,
      users: matchUsersAwarded,
    })
    console.log(`[resolve-matches] resolved fixture ${pred.fixture_id}: ${correctAnswer}, ${matchUsersAwarded} users awarded`)
  }

  // ── Pass 2: re-score already-resolved predictions with unscored user votes ────
  // Handles: admin manual resolve, previous cron run that failed mid-way, etc.
  const { data: resolvedPreds } = await supabase
    .from('predictions')
    .select('id, options, correct_answer')
    .eq('status', 'resolved')
    .not('correct_answer', 'is', null)

  let rescored = 0

  for (const pred of (resolvedPreds ?? [])) {
    const opts = Array.isArray(pred.options) ? (pred.options as string[]) : []
    // Check if any user_predictions for this prediction still have is_correct = null
    const { count } = await supabase
      .from('user_predictions')
      .select('id', { count: 'exact', head: true })
      .eq('prediction_id', pred.id)
      .is('is_correct', null)

    if (!count) continue

    console.log(`[resolve-matches] re-scoring ${count} unscored votes for resolved prediction ${pred.id}`)

    // We don't have exact scores for manually resolved predictions — use 0 for bonus check
    const users = await scoreUserPredictions(
      supabase, pred.id, pred.correct_answer!, 0, 0, affectedUserIds
    )
    rescored += users
  }

  // ── Recalculate streaks for all affected users ────────────────────────────────
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

  return NextResponse.json({ checked, resolved, usersAwarded, rescored, details })
}
