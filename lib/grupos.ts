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

type MockTeam = Omit<GroupTeam, 'team'> & { team: Pick<GroupTeam['team'], 'name' | 'tla'> }

const MOCK_WC_2026: Record<string, MockTeam[]> = {
  'Group A': [
    { position: 1, team: { name: 'Mexico',      tla: 'MEX' }, playedGames: 3, won: 2, draw: 1, lost: 0, goalsFor: 6, goalsAgainst: 2, goalDifference:  4, points: 7 },
    { position: 2, team: { name: 'Poland',       tla: 'POL' }, playedGames: 3, won: 2, draw: 0, lost: 1, goalsFor: 5, goalsAgainst: 3, goalDifference:  2, points: 6 },
    { position: 3, team: { name: 'Saudi Arabia', tla: 'SAU' }, playedGames: 3, won: 1, draw: 0, lost: 2, goalsFor: 3, goalsAgainst: 5, goalDifference: -2, points: 3 },
    { position: 4, team: { name: 'Ecuador',      tla: 'ECU' }, playedGames: 3, won: 0, draw: 1, lost: 2, goalsFor: 2, goalsAgainst: 6, goalDifference: -4, points: 1 },
  ],
  'Group B': [
    { position: 1, team: { name: 'England', tla: 'ENG' }, playedGames: 3, won: 2, draw: 1, lost: 0, goalsFor: 7, goalsAgainst: 1, goalDifference:  6, points: 7 },
    { position: 2, team: { name: 'USA',     tla: 'USA' }, playedGames: 3, won: 1, draw: 2, lost: 0, goalsFor: 4, goalsAgainst: 3, goalDifference:  1, points: 5 },
    { position: 3, team: { name: 'Iran',    tla: 'IRN' }, playedGames: 3, won: 1, draw: 0, lost: 2, goalsFor: 3, goalsAgainst: 5, goalDifference: -2, points: 3 },
    { position: 4, team: { name: 'Wales',   tla: 'WAL' }, playedGames: 3, won: 0, draw: 1, lost: 2, goalsFor: 2, goalsAgainst: 7, goalDifference: -5, points: 1 },
  ],
  'Group C': [
    { position: 1, team: { name: 'Argentina', tla: 'ARG' }, playedGames: 3, won: 3, draw: 0, lost: 0, goalsFor: 8, goalsAgainst: 2, goalDifference:  6, points: 9 },
    { position: 2, team: { name: 'Denmark',   tla: 'DEN' }, playedGames: 3, won: 1, draw: 1, lost: 1, goalsFor: 4, goalsAgainst: 4, goalDifference:  0, points: 4 },
    { position: 3, team: { name: 'Tunisia',   tla: 'TUN' }, playedGames: 3, won: 1, draw: 0, lost: 2, goalsFor: 3, goalsAgainst: 5, goalDifference: -2, points: 3 },
    { position: 4, team: { name: 'Australia', tla: 'AUS' }, playedGames: 3, won: 0, draw: 1, lost: 2, goalsFor: 2, goalsAgainst: 6, goalDifference: -4, points: 1 },
  ],
  'Group D': [
    { position: 1, team: { name: 'France',      tla: 'FRA' }, playedGames: 3, won: 2, draw: 1, lost: 0, goalsFor: 6, goalsAgainst: 2, goalDifference:  4, points: 7 },
    { position: 2, team: { name: 'Netherlands', tla: 'NED' }, playedGames: 3, won: 2, draw: 0, lost: 1, goalsFor: 5, goalsAgainst: 3, goalDifference:  2, points: 6 },
    { position: 3, team: { name: 'Senegal',     tla: 'SEN' }, playedGames: 3, won: 1, draw: 0, lost: 2, goalsFor: 4, goalsAgainst: 5, goalDifference: -1, points: 3 },
    { position: 4, team: { name: 'Peru',        tla: 'PER' }, playedGames: 3, won: 0, draw: 1, lost: 2, goalsFor: 2, goalsAgainst: 7, goalDifference: -5, points: 1 },
  ],
  'Group E': [
    { position: 1, team: { name: 'Spain',      tla: 'ESP' }, playedGames: 3, won: 2, draw: 1, lost: 0, goalsFor: 7, goalsAgainst: 2, goalDifference:  5, points: 7 },
    { position: 2, team: { name: 'Japan',      tla: 'JPN' }, playedGames: 3, won: 2, draw: 0, lost: 1, goalsFor: 4, goalsAgainst: 3, goalDifference:  1, points: 6 },
    { position: 3, team: { name: 'Costa Rica', tla: 'CRC' }, playedGames: 3, won: 1, draw: 0, lost: 2, goalsFor: 3, goalsAgainst: 6, goalDifference: -3, points: 3 },
    { position: 4, team: { name: 'Germany',    tla: 'GER' }, playedGames: 3, won: 0, draw: 1, lost: 2, goalsFor: 3, goalsAgainst: 6, goalDifference: -3, points: 1 },
  ],
  'Group F': [
    { position: 1, team: { name: 'Brazil',      tla: 'BRA' }, playedGames: 3, won: 2, draw: 1, lost: 0, goalsFor: 6, goalsAgainst: 1, goalDifference:  5, points: 7 },
    { position: 2, team: { name: 'Switzerland', tla: 'SUI' }, playedGames: 3, won: 2, draw: 0, lost: 1, goalsFor: 4, goalsAgainst: 3, goalDifference:  1, points: 6 },
    { position: 3, team: { name: 'Cameroon',    tla: 'CMR' }, playedGames: 3, won: 1, draw: 0, lost: 2, goalsFor: 4, goalsAgainst: 5, goalDifference: -1, points: 3 },
    { position: 4, team: { name: 'Serbia',      tla: 'SRB' }, playedGames: 3, won: 0, draw: 1, lost: 2, goalsFor: 2, goalsAgainst: 7, goalDifference: -5, points: 1 },
  ],
  'Group G': [
    { position: 1, team: { name: 'Portugal',    tla: 'POR' }, playedGames: 3, won: 2, draw: 1, lost: 0, goalsFor: 6, goalsAgainst: 2, goalDifference:  4, points: 7 },
    { position: 2, team: { name: 'Uruguay',     tla: 'URU' }, playedGames: 3, won: 2, draw: 0, lost: 1, goalsFor: 4, goalsAgainst: 3, goalDifference:  1, points: 6 },
    { position: 3, team: { name: 'South Korea', tla: 'KOR' }, playedGames: 3, won: 1, draw: 0, lost: 2, goalsFor: 3, goalsAgainst: 5, goalDifference: -2, points: 3 },
    { position: 4, team: { name: 'Ghana',       tla: 'GHA' }, playedGames: 3, won: 0, draw: 1, lost: 2, goalsFor: 2, goalsAgainst: 5, goalDifference: -3, points: 1 },
  ],
  'Group H': [
    { position: 1, team: { name: 'Belgium', tla: 'BEL' }, playedGames: 3, won: 2, draw: 0, lost: 1, goalsFor: 5, goalsAgainst: 3, goalDifference:  2, points: 6 },
    { position: 2, team: { name: 'Croatia', tla: 'CRO' }, playedGames: 3, won: 1, draw: 2, lost: 0, goalsFor: 4, goalsAgainst: 2, goalDifference:  2, points: 5 },
    { position: 3, team: { name: 'Morocco', tla: 'MAR' }, playedGames: 3, won: 1, draw: 1, lost: 1, goalsFor: 3, goalsAgainst: 3, goalDifference:  0, points: 4 },
    { position: 4, team: { name: 'Canada',  tla: 'CAN' }, playedGames: 3, won: 0, draw: 1, lost: 2, goalsFor: 2, goalsAgainst: 6, goalDifference: -4, points: 1 },
  ],
}

export function getMockStandings(): GroupStanding[] {
  return Object.entries(MOCK_WC_2026).map(([label, teams]) => ({
    group: 'GROUP_' + label.replace('Group ', ''),
    table: teams.map(t => ({
      ...t,
      team: { name: t.team.name, shortName: t.team.name, tla: t.team.tla, crest: '' },
    })),
  }))
}

export async function fetchWCStandings(): Promise<GroupStanding[] | null> {
  try {
    const res = await fetch('https://api.football-data.org/v4/competitions/WC/standings', {
      headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY ?? '' },
      next: { revalidate: 300 },
    })
    if (!res.ok) return null
    const data = await res.json()
    const filtered = (data.standings ?? []).filter(
      (s: Record<string, unknown>) => s.type === 'TOTAL' && s.group
    )
    if (filtered.length === 0) return null
    return filtered.map((s: Record<string, unknown>) => ({
      group: s.group as string,
      table: (s.table as Record<string, unknown>[]).map(t => {
        const team = t.team as Record<string, string>
        return {
          position:     t.position     as number,
          team:         { name: team.name ?? '', shortName: team.shortName ?? '', tla: team.tla ?? '', crest: team.crest ?? '' },
          playedGames:  t.playedGames  as number,
          won:          t.won          as number,
          draw:         t.draw         as number,
          lost:         t.lost         as number,
          points:       t.points       as number,
          goalsFor:     t.goalsFor     as number,
          goalsAgainst: t.goalsAgainst as number,
          goalDifference: t.goalDifference as number,
        }
      }),
    }))
  } catch {
    return null
  }
}
