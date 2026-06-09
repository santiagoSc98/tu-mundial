import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const response = await fetch(
      `https://api.football-data.org/v4/matches/${id}`,
      {
        headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY! },
        cache: 'no-store',
      }
    )

    if (!response.ok) {
      return NextResponse.json({ error: `API error ${response.status}` }, { status: response.status })
    }

    const data = await response.json()
    const match = data.match ?? data

    if (match.status === 'FINISHED') {
      const homeScore = match.score?.fullTime?.home ?? 0
      const awayScore = match.score?.fullTime?.away ?? 0
      const homeName = match.homeTeam?.name ?? ''
      const awayName = match.awayTeam?.name ?? ''

      let winner = 'Empate'
      if (homeScore > awayScore) winner = homeName
      else if (awayScore > homeScore) winner = awayName

      return NextResponse.json({ finished: true, homeScore, awayScore, winner, homeName, awayName })
    }

    return NextResponse.json({ finished: false, status: match.status })
  } catch (error) {
    console.error('Error fetching match:', error)
    return NextResponse.json({ error: 'Failed to fetch match' }, { status: 500 })
  }
}
