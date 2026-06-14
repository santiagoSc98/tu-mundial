export type GroupTeam = {
  position: number
  team: { name: string; shortName: string; tla: string; crest: string }
  playedGames: number
  won: number
  draw: number
  lost: number
  points: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
}

export type GroupStanding = {
  group: string // "GROUP_A"
  table: GroupTeam[]
}

export type StandingsByType = {
  total: GroupStanding[]
  home: GroupStanding[]
  away: GroupStanding[]
}

type MockTeam = Omit<GroupTeam, 'team'> & { team: Pick<GroupTeam['team'], 'name' | 'tla'> }

const MOCK_WC_2026: Record<string, MockTeam[]> = {
  'Group A': [
    { position: 1, team: { name: 'Mexico',      tla: 'MEX' }, playedGames: 0, won: 0, draw: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 },
    { position: 2, team: { name: 'South Africa', tla: 'RSA' }, playedGames: 0, won: 0, draw: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 },
    { position: 3, team: { name: 'Korea Republic', tla: 'KOR' }, playedGames: 0, won: 0, draw: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 },
    { position: 4, team: { name: 'Czechia',      tla: 'CZE' }, playedGames: 0, won: 0, draw: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 },
  ],
  'Group B': [
    { position: 1, team: { name: 'Bosnia-Herzegovina', tla: 'BIH' }, playedGames: 0, won: 0, draw: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 },
    { position: 2, team: { name: 'Canada',       tla: 'CAN' }, playedGames: 0, won: 0, draw: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 },
    { position: 3, team: { name: 'Qatar',         tla: 'QAT' }, playedGames: 0, won: 0, draw: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 },
    { position: 4, team: { name: 'Switzerland',   tla: 'SUI' }, playedGames: 0, won: 0, draw: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 },
  ],
}

function toGroupStanding(label: string, teams: MockTeam[]): GroupStanding {
  return {
    group: 'GROUP_' + label.replace('Group ', ''),
    table: teams.map(t => ({
      ...t,
      team: { name: t.team.name, shortName: t.team.name, tla: t.team.tla, crest: '' },
    })),
  }
}

export function getMockStandings(): StandingsByType {
  const total = Object.entries(MOCK_WC_2026).map(([label, teams]) => toGroupStanding(label, teams))
  return { total, home: [], away: [] }
}

function parseStandingsType(
  rawStandings: Record<string, unknown>[],
  type: string,
): GroupStanding[] {
  return rawStandings
    .filter(s => s.type === type && s.group)
    .map(s => ({
      group: s.group as string,
      table: (s.table as Record<string, unknown>[]).map(t => {
        const team = t.team as Record<string, string>
        return {
          position:      t.position      as number,
          team: { name: team.name ?? '', shortName: team.shortName ?? '', tla: team.tla ?? '', crest: team.crest ?? '' },
          playedGames:   t.playedGames   as number,
          won:           t.won           as number,
          draw:          t.draw          as number,
          lost:          t.lost          as number,
          points:        t.points        as number,
          goalsFor:      t.goalsFor      as number,
          goalsAgainst:  t.goalsAgainst  as number,
          goalDifference: t.goalDifference as number,
        }
      }),
    }))
}

export async function fetchWCStandings(): Promise<StandingsByType | null> {
  try {
    const res = await fetch('https://api.football-data.org/v4/competitions/WC/standings', {
      headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY ?? '' },
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null
    const data = await res.json()
    const rawStandings = (data.standings ?? []) as Record<string, unknown>[]

    const total = parseStandingsType(rawStandings, 'TOTAL')
    if (total.length === 0) return null

    return {
      total,
      home: parseStandingsType(rawStandings, 'HOME'),
      away: parseStandingsType(rawStandings, 'AWAY'),
    }
  } catch {
    return null
  }
}
