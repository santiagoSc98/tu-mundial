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
  LAST_32:        1.5,
  LAST_16:        2,
  QUARTER_FINALS: 2.5,
  SEMI_FINALS:    3,
  THIRD_PLACE:    2,
  FINAL:          5,
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabase()

  const stages = 'LAST_32,LAST_16,QUARTER_FINALS,SEMI_FINALS,THIRD_PLACE,FINAL'
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
  let updated = 0
  let skipped = 0

  for (const match of matches) {
    const homeRaw: string | undefined = match.homeTeam?.name
    const awayRaw: string | undefined = match.awayTeam?.name

    const homeName = homeRaw ? getTeamNameES(homeRaw) : 'Por definir'
    const awayName = awayRaw ? getTeamNameES(awayRaw) : 'Por definir'
    const homeTla  = match.homeTeam?.tla ?? 'TBD'
    const awayTla  = match.awayTeam?.tla ?? 'TBD'

    const fixtureId = String(match.id)
    const stage: string = match.stage
    const multiplier = MULTIPLIERS[stage] ?? 1.5
    const deadline = new Date(new Date(match.utcDate).getTime() - 10 * 60_000).toISOString()

    // Check if prediction already exists for this fixture
    const { data: existing } = await supabase
      .from('predictions')
      .select('id, options, home_team_code, away_team_code')
      .eq('fixture_id', fixtureId)
      .maybeSingle()

    if (existing) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const opts = existing.options as any[]
      const needsUpdate =
        (opts[0] === 'Por definir' && homeName !== 'Por definir') ||
        (opts[opts.length - 1] === 'Por definir' && awayName !== 'Por definir')

      if (needsUpdate) {
        const { error } = await supabase
          .from('predictions')
          .update({
            title:          `${homeName} vs ${awayName} - Mundial 2026`,
            options:        [homeName, 'Empate', awayName],
            home_team_code: homeTla,
            away_team_code: awayTla,
          })
          .eq('id', existing.id)

        if (error) {
          console.error(`[sync-knockout] update failed for fixture ${fixtureId}:`, error)
        } else {
          console.log(`[sync-knockout] updated placeholder: ${homeName} vs ${awayName} (${stage})`)
          updated++
        }
      } else {
        skipped++
      }
      continue
    }

    // Create new prediction (with real teams or placeholder)
    console.log('[sync-knockout] insertando:', {
      fixture_id: match.id,
      stage: match.stage,
      home: homeName,
      away: awayName,
    })

    const { error: insertError } = await supabase
      .from('predictions')
      .insert({
        title:                `${homeName} vs ${awayName} - Mundial 2026`,
        description:          `Fase: ${stage}`,
        category:             'eliminatoria',
        deadline,
        options:              [homeName, 'Empate', awayName],
        fixture_id:           fixtureId,
        status:               'open',
        stage,
        difficulty_multiplier: multiplier,
        home_team_code:       homeTla,
        away_team_code:       awayTla,
      })

    if (insertError) {
      console.error('[sync-knockout] error INSERT:', insertError)
    } else {
      console.log(`[sync-knockout] created: ${homeName} vs ${awayName} (${stage})`)
      created++
    }
  }

  return NextResponse.json({ checked: matches.length, created, updated, skipped })
}
