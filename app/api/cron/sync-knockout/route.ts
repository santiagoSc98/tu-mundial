import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getTeamNameES } from '@/lib/worldcup'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

const MULTIPLIERS: Record<string, number> = {
  LAST_16:       1.5,
  QUARTER_FINALS: 2,
  SEMI_FINALS:    3,
  FINAL:          5,
}

const PLACEHOLDER_PATTERNS = ['Winner', 'Loser', 'TBD', 'Match', 'Winner of', 'Loser of']

function isPlaceholder(name: string | null | undefined): boolean {
  if (!name) return true
  return PLACEHOLDER_PATTERNS.some(p => name.includes(p))
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabase()

  const stages = 'LAST_16,QUARTER_FINALS,SEMI_FINALS,FINAL'
  const res = await fetch(
    `https://api.football-data.org/v4/competitions/2000/matches?stage=${stages}`,
    {
      headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY! },
      cache: 'no-store',
    },
  )

  if (!res.ok) {
    console.error('[sync-knockout] API error:', res.status)
    return NextResponse.json({ error: `API ${res.status}` }, { status: 502 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: { matches: any[] } = await res.json()
  const matches = data.matches ?? []

  let created = 0
  let skipped = 0

  for (const match of matches) {
    const homeTeamRaw: string | undefined = match.homeTeam?.name
    const awayTeamRaw: string | undefined = match.awayTeam?.name

    // Skip placeholder matchups not yet determined
    if (isPlaceholder(homeTeamRaw) || isPlaceholder(awayTeamRaw)) {
      skipped++
      continue
    }

    const fixtureId = String(match.id)

    // Check if prediction already exists for this fixture
    const { data: existing } = await supabase
      .from('predictions')
      .select('id')
      .eq('fixture_id', fixtureId)
      .maybeSingle()

    if (existing) {
      skipped++
      continue
    }

    const stage: string = match.stage
    const multiplier = MULTIPLIERS[stage] ?? 1

    // Deadline: kick-off - 10 min
    const deadline = new Date(new Date(match.utcDate).getTime() - 10 * 60_000).toISOString()

    const homeTeam = homeTeamRaw!
    const awayTeam = awayTeamRaw!
    const homeES   = getTeamNameES(homeTeam)
    const awayES   = getTeamNameES(awayTeam)

    // No draw in knockout — options has 2 elements
    const { error } = await supabase
      .from('predictions')
      .insert({
        title:                `${homeES} vs ${awayES} - Mundial 2026`,
        description:          `Fase: ${stage}`,
        category:             'eliminatoria',
        deadline,
        options:              [homeTeam, awayTeam],
        fixture_id:           fixtureId,
        status:               'open',
        difficulty_multiplier: multiplier,
        home_team_code:       match.homeTeam?.tla ?? null,
        away_team_code:       match.awayTeam?.tla ?? null,
      })

    if (error) {
      console.error(`[sync-knockout] insert failed for fixture ${fixtureId}:`, error)
    } else {
      console.log(`[sync-knockout] created: ${homeES} vs ${awayES} (${stage})`)
      created++
    }
  }

  return NextResponse.json({ checked: matches.length, created, skipped })
}
