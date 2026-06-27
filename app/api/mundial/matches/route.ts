import { NextResponse } from 'next/server'

const STAGE_LABELS: Record<string, string> = {
  GROUP_STAGE:    'Fase de Grupos',
  LAST_32:        'Dieciseisavos de Final',
  LAST_16:        'Octavos de Final',
  ROUND_OF_16:    'Octavos de Final',
  QUARTER_FINALS: 'Cuartos de Final',
  SEMI_FINALS:    'Semifinales',
  THIRD_PLACE:    'Tercer Puesto',
  FINAL:          'Final',
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const competition = searchParams.get('competition') ?? 'WC'

  console.log('[mundial/matches] API Key exists:', !!process.env.FOOTBALL_DATA_API_KEY)
  console.log('[mundial/matches] Fetching competition:', competition)

  try {
    const response = await fetch(
      `https://api.football-data.org/v4/competitions/${competition}/matches`,
      {
        headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY! },
        cache: 'no-store',
      }
    )

    console.log('[mundial/matches] Football-Data API status:', response.status)

    if (!response.ok) {
      const text = await response.text()
      console.error('[mundial/matches] API Error:', response.status, text.slice(0, 500))
      return NextResponse.json([], { status: 200 })
    }

    const data = await response.json()
    console.log('[mundial/matches] Total matches in response:', data.matches?.length ?? 0)

    const allStatuses = [...new Set((data.matches ?? []).map((m: Record<string, unknown>) => m.status))]
    console.log('[mundial/matches] All match statuses found:', allStatuses)

    const matches = (data.matches ?? [])
      .filter((m: Record<string, unknown>) =>
        m.status === 'SCHEDULED' || m.status === 'TIMED' || m.status === 'IN_PLAY'
      )
      .map((m: Record<string, unknown>) => {
        const home = m.homeTeam as Record<string, string>
        const away = m.awayTeam as Record<string, string>
        return {
          id: m.id,
          homeTeam: home.name,
          homeTeamCode: home.tla,
          awayTeam: away.name,
          awayTeamCode: away.tla,
          date: m.utcDate,
          status: m.status,
          stage: m.stage,
          stageLabel: STAGE_LABELS[(m.stage as string) ?? ''] ?? m.stage,
          group: m.group ?? null,
          venue: (m as Record<string, unknown>).venue ?? 'TBD',
        }
      })

    console.log('[mundial/matches] Filtered matches (scheduled/timed/in_play):', matches.length)
    return NextResponse.json(matches)
  } catch (error) {
    console.error('[mundial/matches] Fetch error:', error)
    return NextResponse.json([], { status: 200 })
  }
}
