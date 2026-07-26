import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getTeamNameES } from '@/lib/worldcup'

export const maxDuration = 60

// Champions League 2025/26 — tournament_id en Supabase
const CHAMPIONS_TOURNAMENT_ID = 'ebbc9141-c438-4bc3-9f5f-49c0987ef5d6'
const COMPETITION_ID = 2001
// Sin season=XXXX, football-data.org devuelve la temporada "actual" según su
// calendario — desde julio 2026 eso sería 2026/27 (vacía). Fijamos 2025 explícito.
const SEASON = 2025

// 10 req/min en el free tier de football-data.org
const DELAY_MS = 6200

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function teamCrest(team: any): string | null {
  if (!team) return null
  if (team.crest) return team.crest as string
  // Fallback: football-data.org serves crests by team id at this stable URL
  if (team.id) return `https://crests.football-data.org/${team.id}.png`
  return null
}

// difficulty_multiplier por fase
const MULTIPLIERS: Record<string, number> = {
  LEAGUE_PHASE:     1.0,
  KNOCKOUT_PLAYOFF: 1.5,
  LAST_16:          2.0,
  QUARTER_FINALS:   2.5,
  SEMI_FINALS:      3.0,
  FINAL:            5.0,
}

// Etiqueta legible para títulos
const STAGE_LABEL: Record<string, string> = {
  KNOCKOUT_PLAYOFF: 'Playoff',
  LAST_16:          'Octavos',
  QUARTER_FINALS:   'Cuartos',
  SEMI_FINALS:      'Semis',
  FINAL:            'Final',
}

// Clave canónica para identificar un tie sin importar qué equipo juega de local
function tieKey(id1: number, id2: number): string {
  return `${Math.min(id1, id2)}-${Math.max(id1, id2)}`
}

type Supabase = ReturnType<typeof getSupabase>

// ─── Upsert de una prediction de llave (knockout) ────────────────────────────
async function upsertKoMatch(
  supabase: Supabase,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  match: any,
  stage: string,
  tieId: string | null,
  legNumber: 1 | 2 | null,
): Promise<'created' | 'updated' | 'skipped'> {
  const homeRaw: string | undefined = match.homeTeam?.name
  const awayRaw: string | undefined = match.awayTeam?.name
  const homeName  = homeRaw ? getTeamNameES(homeRaw) : 'Por definir'
  const awayName  = awayRaw ? getTeamNameES(awayRaw) : 'Por definir'
  const homeTla   = match.homeTeam?.tla   ?? null
  const awayTla   = match.awayTeam?.tla   ?? null
  const homeCrest = teamCrest(match.homeTeam)
  const awayCrest = teamCrest(match.awayTeam)
  const fixtureId = String(match.id)
  const deadline  = new Date(new Date(match.utcDate).getTime() - 10 * 60_000).toISOString()
  const multiplier = MULTIPLIERS[stage] ?? 1.5

  // Igual que el Mundial: siempre 3 opciones [home, 'Empate', away].
  const options = [homeName, 'Empate', awayName]

  const legSuffix = legNumber === 1 ? ' (Ida)' : legNumber === 2 ? ' (Vuelta)' : ''
  const title = `${homeName} vs ${awayName} - UCL ${STAGE_LABEL[stage] ?? stage}${legSuffix}`

  const { data: existing } = await supabase
    .from('predictions')
    .select('id, options, home_team_code, away_team_code, knockout_tie_id, home_team_crest')
    .eq('fixture_id', fixtureId)
    .maybeSingle()

  if (existing) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const opts = existing.options as any[]
    const needsUpdate =
      (opts[0] === 'Por definir' && homeName !== 'Por definir') ||
      (opts[opts.length - 1] === 'Por definir' && awayName !== 'Por definir') ||
      (!existing.knockout_tie_id && tieId) ||
      (!existing.home_team_crest && homeCrest)

    if (needsUpdate) {
      await supabase
        .from('predictions')
        .update({
          title,
          options,
          home_team_code:   homeTla,
          away_team_code:   awayTla,
          home_team_crest:  homeCrest,
          away_team_crest:  awayCrest,
          knockout_tie_id:  tieId,
          leg_number:       legNumber,
        })
        .eq('id', existing.id)

      if (tieId && legNumber) {
        await linkLeg(supabase, tieId, existing.id, legNumber)
      }
      return 'updated'
    }
    return 'skipped'
  }

  const { data: newPred, error } = await supabase
    .from('predictions')
    .insert({
      title,
      description:           `Champions League 2025/26 - ${STAGE_LABEL[stage] ?? stage}${legSuffix}`,
      category:              'eliminatoria',
      deadline,
      options,
      fixture_id:            fixtureId,
      status:                'open',
      stage,
      difficulty_multiplier: multiplier,
      home_team_code:        homeTla,
      away_team_code:        awayTla,
      home_team_crest:       homeCrest,
      away_team_crest:       awayCrest,
      tournament_id:         CHAMPIONS_TOURNAMENT_ID,
      knockout_tie_id:       tieId,
      leg_number:            legNumber,
    })
    .select('id')
    .single()

  if (error || !newPred) {
    console.error(`[sync-champions] insert ko ${fixtureId}:`, error)
    return 'skipped'
  }

  if (tieId && legNumber) {
    await linkLeg(supabase, tieId, newPred.id, legNumber)
  }

  return 'created'
}

// Registra el match_id en knockout_ties.leg1_match_id o leg2_match_id
async function linkLeg(
  supabase: Supabase,
  tieId: string,
  matchId: string,
  legNumber: 1 | 2,
) {
  const field = legNumber === 1 ? 'leg1_match_id' : 'leg2_match_id'
  const { error } = await supabase
    .from('knockout_ties')
    .update({ [field]: matchId, updated_at: new Date().toISOString() })
    .eq('id', tieId)
  if (error) console.error(`[sync-champions] linkLeg ${tieId} leg${legNumber}:`, error)
}

// ─── Handler ─────────────────────────────────────────────────────────────────
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabase()
  let created     = 0
  let updated     = 0
  let skipped     = 0
  let tiesCreated = 0

  // ─── Fase de Liga (288 partidos, un solo GET) ─────────────────────────────
  // La API usa "LEAGUE_STAGE"; en DB guardamos "LEAGUE_PHASE" para el frontend
  const leagueUrl = `https://api.football-data.org/v4/competitions/${COMPETITION_ID}/matches?season=${SEASON}&stage=LEAGUE_STAGE`
  console.log('[sync-champions] fetching league phase:', leagueUrl)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let leagueBody: any
  let leagueRawText = ''

  try {
    const leagueAbort = new AbortController()
    const leagueTimer = setTimeout(() => leagueAbort.abort(), 25_000)

    const leagueRes = await fetch(leagueUrl, {
      headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY! },
      cache: 'no-store',
      signal: leagueAbort.signal,
    })
    clearTimeout(leagueTimer)

    console.log('[sync-champions] league phase status:', leagueRes.status, leagueRes.statusText)
    leagueRawText = await leagueRes.text()
    console.log('[sync-champions] league phase raw (first 800 chars):', leagueRawText.slice(0, 800))

    if (!leagueRes.ok) {
      return NextResponse.json(
        { error: `League API ${leagueRes.status}`, body: leagueRawText.slice(0, 400) },
        { status: 502 },
      )
    }

    leagueBody = JSON.parse(leagueRawText)
  } catch (e) {
    console.error('[sync-champions] league phase fetch/parse failed:', e)
    return NextResponse.json(
      { error: String(e), rawPreview: leagueRawText.slice(0, 400) },
      { status: 502 },
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leagueMatches: any[] = leagueBody.matches ?? []
  console.log(`[sync-champions] league phase: ${leagueMatches.length} matches — top-level keys: ${Object.keys(leagueBody).join(', ')}`)
  if (leagueMatches.length > 0) {
    console.log('[sync-champions] first match stage:', leagueMatches[0]?.stage, '— season:', leagueBody.competition?.id, '— filters:', JSON.stringify(leagueBody.filters))
  }

  for (const match of leagueMatches) {
    const homeRaw: string | undefined = match.homeTeam?.name
    const awayRaw: string | undefined = match.awayTeam?.name
    const homeName  = homeRaw ? getTeamNameES(homeRaw) : 'Por definir'
    const awayName  = awayRaw ? getTeamNameES(awayRaw) : 'Por definir'
    const homeTla   = match.homeTeam?.tla   ?? null
    const awayTla   = match.awayTeam?.tla   ?? null
    const homeCrest = match.homeTeam?.crest ?? null
    const awayCrest = match.awayTeam?.crest ?? null
    const fixtureId = String(match.id)
    const deadline  = new Date(new Date(match.utcDate).getTime() - 10 * 60_000).toISOString()
    const title     = `${homeName} vs ${awayName} - UCL Fase de Liga`

    const { data: existing } = await supabase
      .from('predictions')
      .select('id, options, home_team_code, away_team_code, home_team_crest')
      .eq('fixture_id', fixtureId)
      .maybeSingle()

    if (existing) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const opts = existing.options as any[]
      const needsUpdate =
        (opts[0] === 'Por definir' && homeName !== 'Por definir') ||
        (opts[opts.length - 1] === 'Por definir' && awayName !== 'Por definir') ||
        (!existing.home_team_crest && homeCrest)

      if (needsUpdate) {
        await supabase.from('predictions').update({
          title,
          options:         [homeName, 'Empate', awayName],
          home_team_code:  homeTla,
          away_team_code:  awayTla,
          home_team_crest: homeCrest,
          away_team_crest: awayCrest,
        }).eq('id', existing.id)
        updated++
      } else {
        skipped++
      }
      continue
    }

    const { error } = await supabase.from('predictions').insert({
      title,
      description:           'Champions League 2025/26 - Fase de Liga',
      category:              'fase-liga',
      deadline,
      options:               [homeName, 'Empate', awayName],
      fixture_id:            fixtureId,
      status:                'open',
      stage:                 'LEAGUE_PHASE',
      difficulty_multiplier: MULTIPLIERS.LEAGUE_PHASE,
      home_team_code:        homeTla,
      away_team_code:        awayTla,
      home_team_crest:       homeCrest,
      away_team_crest:       awayCrest,
      tournament_id:         CHAMPIONS_TOURNAMENT_ID,
    })

    if (error) {
      console.error(`[sync-champions] insert league ${fixtureId}:`, error)
    } else {
      created++
    }
  }

  // ─── Fases eliminatorias (1 GET, respetando rate limit) ──────────────────
  await sleep(DELAY_MS)
  console.log('[sync-champions] fetching knockout stages...')

  const koStages = 'KNOCKOUT_PLAYOFF,LAST_16,QUARTER_FINALS,SEMI_FINALS,FINAL'
  const koRes = await fetch(
    `https://api.football-data.org/v4/competitions/${COMPETITION_ID}/matches?season=${SEASON}&stage=${koStages}`,
    { headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY! }, cache: 'no-store' },
  )

  if (!koRes.ok) {
    console.error('[sync-champions] knockout API error:', koRes.status)
    return NextResponse.json({
      error: `Knockout API ${koRes.status}`,
      league: { created, updated, skipped },
    }, { status: 502 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const koMatches: any[] = (await koRes.json()).matches ?? []
  console.log(`[sync-champions] knockout: ${koMatches.length} matches`)

  // Agrupar por stage
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const byStage = new Map<string, any[]>()
  for (const m of koMatches) {
    const s: string = m.stage
    if (!byStage.has(s)) byStage.set(s, [])
    byStage.get(s)!.push(m)
  }

  for (const [stage, stageMatches] of byStage) {
    // FINAL: partido único — sin llave de ida/vuelta
    if (stage === 'FINAL') {
      for (const match of stageMatches) {
        const r = await upsertKoMatch(supabase, match, stage, null, null)
        if (r === 'created') created++
        else if (r === 'updated') updated++
        else skipped++
      }
      continue
    }

    // Agrupar partidos de cada llave por par de equipos
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tieMap = new Map<string, any[]>()
    for (const m of stageMatches) {
      const key = tieKey(m.homeTeam?.id ?? 0, m.awayTeam?.id ?? 0)
      if (!tieMap.has(key)) tieMap.set(key, [])
      tieMap.get(key)!.push(m)
    }

    for (const [, legs] of tieMap) {
      // El partido con fecha anterior = Ida (leg 1)
      legs.sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())
      const [leg1, leg2] = legs

      if (!leg1) continue

      // El equipo local de la Ida es el "home" del tie
      const tieHomeId = leg1.homeTeam?.id ?? 0
      const tieAwayId = leg1.awayTeam?.id ?? 0

      // Buscar o crear el knockout_tie
      const { data: existingTie } = await supabase
        .from('knockout_ties')
        .select('id, leg1_match_id, leg2_match_id')
        .eq('tournament_id', CHAMPIONS_TOURNAMENT_ID)
        .eq('stage', stage)
        .eq('team_home_id', tieHomeId)
        .eq('team_away_id', tieAwayId)
        .maybeSingle()

      let tieId: string

      if (existingTie) {
        tieId = existingTie.id
        console.log(`[sync-champions] existing tie ${tieId} (${stage})`)
      } else {
        const { data: newTie, error: tieErr } = await supabase
          .from('knockout_ties')
          .insert({
            tournament_id: CHAMPIONS_TOURNAMENT_ID,
            stage,
            team_home_id:  tieHomeId,
            team_away_id:  tieAwayId,
          })
          .select('id')
          .single()

        if (tieErr || !newTie) {
          console.error(`[sync-champions] tie insert ${stage}:`, tieErr)
          continue
        }

        tieId = newTie.id
        tiesCreated++
        console.log(`[sync-champions] created tie ${tieId} (${stage}: ${tieHomeId} vs ${tieAwayId})`)
      }

      // Upsert Ida
      const r1 = await upsertKoMatch(supabase, leg1, stage, tieId, 1)
      if (r1 === 'created') created++
      else if (r1 === 'updated') updated++
      else skipped++

      // Upsert Vuelta (puede no existir aún si TBD)
      if (leg2) {
        const r2 = await upsertKoMatch(supabase, leg2, stage, tieId, 2)
        if (r2 === 'created') created++
        else if (r2 === 'updated') updated++
        else skipped++
      }
    }
  }

  console.log(`[sync-champions] done: created=${created} updated=${updated} skipped=${skipped} tiesCreated=${tiesCreated}`)
  return NextResponse.json({ created, updated, skipped, tiesCreated })
}
