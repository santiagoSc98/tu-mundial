import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import HomeClient from '@/components/HomeClient'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { fetchWCStandings } from '@/lib/grupos'
import type { StandingsByType } from '@/lib/grupos'

const PRED_COLS = [
  'id', 'title', 'description', 'category', 'deadline', 'correct_answer',
  'difficulty_multiplier', 'status', 'options', 'stage', 'fixture_id',
  'home_team_code', 'away_team_code', 'exact_score_home', 'exact_score_away',
].join(', ')

// ─── Timeout helper ──────────────────────────────────────────────────────────
function withTimeout<T>(thenable: PromiseLike<T>, ms = 9000, label = 'query'): Promise<T> {
  return Promise.race([
    Promise.resolve(thenable),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timeout (${ms}ms)`)), ms)
    ),
  ])
}

// ─── Retry helper ────────────────────────────────────────────────────────────
async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  let lastErr: unknown
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      if (i < retries) {
        console.warn(`[home] retry ${i + 1}/${retries}...`)
        await new Promise(r => setTimeout(r, 600 * (i + 1)))
      }
    }
  }
  throw lastErr
}

// ─── Loading fallback ────────────────────────────────────────────────────────
function HomeLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#07111F' }}>
      <div className="text-center">
        <div
          className="w-10 h-10 rounded-full mx-auto mb-4 animate-spin"
          style={{ border: '3px solid rgba(0,106,51,0.20)', borderTopColor: '#006A33' }}
        />
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>Cargando...</p>
      </div>
    </div>
  )
}

// ─── Async data component ────────────────────────────────────────────────────
async function HomeData() {
  const t0 = Date.now()
  const supabase = await createClient()

  // 1. Auth
  const { data: { user } } = await withRetry(() =>
    withTimeout(supabase.auth.getUser(), 9000, 'auth')
  )
  console.log(`[home] auth: ${Date.now() - t0}ms`)
  if (!user) redirect('/')

  // Fire-and-forget — does not block page load
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(supabase as any)
    .from('profiles')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', user.id)
    .then(() => {})

  // Read pending join code cookie (deletion happens via server action after client consumes it)
  const cookieStore = await cookies()
  const pendingJoinCode = cookieStore.get('pending_join_code')?.value ?? null

  // 2. All data in one parallel batch
  const t1 = Date.now()
  const [
    specialRes, profileRes, predsRes, answersRes,
    rankingsRes, myStatsRes, allUserPredsRes, totalUsersRes, allVotesRes, groupsRes,
    badgesRes,
  ] = await withRetry(() =>
    withTimeout(
      Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any)
          .from('special_predictions')
          .select('champion_team, top_scorer')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('profiles')
          .select('id, total_points, avatar_url, username, current_streak, country')
          .eq('id', user.id)
          .single(),
        supabase
          .from('predictions')
          .select(PRED_COLS)
          .order('deadline', { ascending: true })
          .limit(500),
        // Current user's predictions — for existingAnswers + existingScores + existingVotes
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any)
          .from('user_predictions')
          .select('prediction_id, predicted_answer, home_score_prediction, away_score_prediction, is_correct, points_earned')
          .eq('user_id', user.id),
        supabase
          .from('profiles')
          .select('id, username, avatar_url, total_points, current_streak, correct_predictions, created_at')
          .order('total_points', { ascending: false })
          .order('correct_predictions', { ascending: false })
          .order('created_at', { ascending: true })
          .limit(50),
        supabase
          .from('user_predictions')
          .select('is_correct, created_at')
          .eq('user_id', user.id)
          .not('is_correct', 'is', null),
        // All users — for predCounts + globalStats (needs user_id + is_correct)
        supabase
          .from('user_predictions')
          .select('user_id, is_correct'),
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true }),
        // All users — for voteDistributions (no user filter — requires RLS SELECT policy)
        supabase
          .from('user_predictions')
          .select('prediction_id, predicted_answer'),
        // Groups the current user belongs to
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any)
          .from('group_members')
          .select('groups(id, name, code, created_by, prize_amount, entry_fee, currency)')
          .eq('user_id', user.id),
        // User badges
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any)
          .from('user_badges')
          .select('badge_id, unlocked_at')
          .eq('user_id', user.id)
          .order('unlocked_at', { ascending: false }),
      ]),
      18000,
      'all-data'
    )
  )
  console.log(`[home] parallel fetch: ${Date.now() - t1}ms`)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  console.log('[home] predsRes error:', (predsRes as any).error)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  console.log('[home] total predictions:', (predsRes.data as any[])?.length)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  console.log('[home] LAST_32:', (predsRes.data as any[])?.filter((p: any) => p.stage === 'LAST_32').length)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  console.log('[home] stages:', [...new Set((predsRes.data as any[])?.map((p: any) => p.stage))])

  const special     = specialRes.data
  const profileData = profileRes.data
  const myBadges    = (badgesRes.data ?? []) as { badge_id: string; unlocked_at: string }[]

  // Build existingAnswers + existingScores + existingVotes maps
  const existingAnswers: Record<string, string> = {}
  const existingScores: Record<string, { home: number; away: number }> = {}
  const existingVotes: Record<string, { isCorrect: boolean | null; pointsEarned: number | null }> = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  answersRes.data?.forEach((up: any) => {
    existingAnswers[up.prediction_id] = up.predicted_answer
    if (up.home_score_prediction != null && up.away_score_prediction != null) {
      existingScores[up.prediction_id] = {
        home: up.home_score_prediction,
        away: up.away_score_prediction,
      }
    }
    existingVotes[up.prediction_id] = {
      isCorrect:    up.is_correct    ?? null,
      pointsEarned: up.points_earned ?? null,
    }
  })

  if (!special?.champion_team && !special?.top_scorer) redirect('/')

  const profile = profileData ?? { id: user.id, total_points: 0, avatar_url: null, username: null, current_streak: 0, country: 'Paraguay' }

  // Build rank
  const rankings = (rankingsRes.data ?? []) as { id: string; username: string | null; avatar_url: string | null; total_points: number; current_streak: number }[]
  const rankIdx   = rankings.findIndex(r => r.id === user.id)
  const rank      = rankIdx >= 0 ? rankIdx + 1 : (rankings.filter(r => r.total_points > profile.total_points).length + 1)

  // Build myStats + currentStreak
  const myStatsRows = (myStatsRes.data ?? []) as { is_correct: boolean | null; created_at: string }[]
  const myStats = {
    total:   myStatsRows.length,
    correct: myStatsRows.filter(r => r.is_correct === true).length,
  }
  const resolvedSorted = [...myStatsRows].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  let currentStreak = 0
  for (const pred of resolvedSorted) {
    if (pred.is_correct) currentStreak++
    else break
  }

  // Build predCounts + globalStats from allUserPreds (user_id + is_correct only)
  const allUserPreds = (allUserPredsRes.data ?? []) as { user_id: string; is_correct: boolean | null }[]
  const predCounts: Record<string, number> = {}
  allUserPreds.forEach(r => {
    predCounts[r.user_id] = (predCounts[r.user_id] ?? 0) + 1
  })
  const resolvedPreds = allUserPreds.filter(r => r.is_correct !== null)
  const correctPreds  = resolvedPreds.filter(r => r.is_correct === true)

  // Build voteDistributions from ALL users' votes (no user filter)
  // Requires RLS policy: CREATE POLICY "public vote distributions"
  //   ON user_predictions FOR SELECT TO authenticated USING (true);
  const voteDistributions: Record<string, Record<string, number>> = {}
  const allVotes = (allVotesRes.data ?? []) as { prediction_id: string; predicted_answer: string }[]
  allVotes.forEach(r => {
    if (!r.prediction_id || !r.predicted_answer) return
    if (!voteDistributions[r.prediction_id]) voteDistributions[r.prediction_id] = {}
    voteDistributions[r.prediction_id][r.predicted_answer] =
      (voteDistributions[r.prediction_id][r.predicted_answer] ?? 0) + 1
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const initialGroups = (groupsRes.data ?? []).map((r: any) => r.groups).filter(Boolean)

  const globalStats = {
    totalUsers:       (totalUsersRes as { count: number | null }).count ?? 0,
    totalPredictions: allUserPreds.length,
    avgAccuracy:      resolvedPreds.length > 0 ? Math.round((correctPreds.length / resolvedPreds.length) * 100) : 0,
  }

  // Fetch real WC standings (cached 1h by Next.js — fast on subsequent requests)
  let wcStandings: StandingsByType | null = null
  try {
    wcStandings = await Promise.race([
      fetchWCStandings(),
      new Promise<null>(resolve => setTimeout(() => resolve(null), 5000)),
    ])
  } catch {
    // fallback to null — CalendarioView handles it gracefully
  }

  console.log(`[home] total: ${Date.now() - t0}ms`)

  const username =
    profileData?.username ??
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email?.split('@')[0] ??
    ''

  const avatarUrl =
    profileData?.avatar_url ??
    user.user_metadata?.avatar_url ??
    user.user_metadata?.picture ??
    null

  const isAdmin = ['santiagocampuzano68@gmail.com'].includes(user.email ?? '')

  return (
    <HomeClient
      userId={user.id}
      points={profile.total_points}
      username={username}
      avatarUrl={avatarUrl}
      championTeam={special?.champion_team ?? null}
      topScorer={special?.top_scorer ?? null}
      rank={rank}
      isAdmin={isAdmin}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      predictions={(predsRes.data ?? []) as any[]}
      existingAnswers={existingAnswers}
      existingScores={existingScores}
      existingVotes={existingVotes}
      rankings={rankings}
      myStats={myStats}
      predCounts={predCounts}
      globalStats={globalStats}
      voteDistributions={voteDistributions}
      initialGroups={initialGroups}
      currentStreak={currentStreak}
      pendingJoinCode={pendingJoinCode}
      wcStandings={wcStandings}
      myBadges={myBadges}
      profileData={{ id: user.id, username, avatarUrl, total_points: profile.total_points, current_streak: currentStreak, country: profile.country ?? 'Paraguay' }}
    />
  )
}

// ─── Page shell ──────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<HomeLoading />}>
        <HomeData />
      </Suspense>
    </ErrorBoundary>
  )
}
