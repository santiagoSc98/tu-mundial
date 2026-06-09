import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import HomeClient from '@/components/HomeClient'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const PRED_COLS = [
  'id', 'title', 'description', 'category', 'deadline', 'correct_answer',
  'difficulty_multiplier', 'status', 'options', 'home_team_code', 'away_team_code',
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

  // 2. Special predictions + profile + predictions + userAnswers (all parallel)
  const t1 = Date.now()
  const [specialRes, profileRes, predsRes, answersRes] = await withRetry(() =>
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
          .select('total_points, avatar_url, username')
          .eq('id', user.id)
          .single(),
        supabase
          .from('predictions')
          .select(PRED_COLS)
          .order('deadline', { ascending: true }),
        supabase
          .from('user_predictions')
          .select('prediction_id, predicted_answer')
          .eq('user_id', user.id),
      ]),
      12000,
      'special+profile+preds+answers'
    )
  )
  console.log(`[home] parallel fetch: ${Date.now() - t1}ms`)

  const special     = specialRes.data
  const profileData = profileRes.data

  // Build existingAnswers map from server
  const existingAnswers: Record<string, string> = {}
  answersRes.data?.forEach((up: { prediction_id: string; predicted_answer: string }) => {
    existingAnswers[up.prediction_id] = up.predicted_answer
  })

  if (!special?.champion_team && !special?.top_scorer) redirect('/')

  const profile = profileData ?? { total_points: 0, avatar_url: null, username: null }

  // 3. Rank
  const t2 = Date.now()
  const rankRes = await withRetry(() =>
    withTimeout(
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gt('total_points', profile.total_points),
      9000,
      'rank'
    )
  )
  const rankAbove = (rankRes as { count: number | null }).count
  console.log(`[home] rank: ${Date.now() - t2}ms | total: ${Date.now() - t0}ms`)

  const rank = (rankAbove ?? 0) + 1

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
