import { NextResponse } from 'next/server'

export const maxDuration = 30

const COMPETITION_ID = 2001

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch competition metadata — exposes valid stage names for the current season
  const url = `https://api.football-data.org/v4/competitions/${COMPETITION_ID}`
  console.log('[diag-champions] fetching:', url)

  try {
    const res = await fetch(url, {
      headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY! },
      cache: 'no-store',
    })
    const text = await res.text()
    console.log('[diag-champions] status:', res.status)
    console.log('[diag-champions] body:', text.slice(0, 2000))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: any = JSON.parse(text)

    // Also fetch one page of matches without any stage filter to see what stage values come back
    const matchesUrl = `https://api.football-data.org/v4/competitions/${COMPETITION_ID}/matches?limit=5`
    console.log('[diag-champions] fetching sample matches:', matchesUrl)
    const mRes = await fetch(matchesUrl, {
      headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY! },
      cache: 'no-store',
    })
    const mText = await mRes.text()
    console.log('[diag-champions] matches status:', mRes.status)
    console.log('[diag-champions] matches body:', mText.slice(0, 1500))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mBody: any = JSON.parse(mText)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stageSample = (mBody.matches ?? []).slice(0, 5).map((m: any) => ({
      id: m.id, stage: m.stage, matchday: m.matchday, utcDate: m.utcDate,
    }))

    return NextResponse.json({
      competitionId:   body.id,
      competitionName: body.name,
      currentSeason:   body.currentSeason,
      seasons:         (body.seasons ?? []).slice(0, 3),
      stageSample,
      matchesFilters:  mBody.filters,
    })
  } catch (e) {
    console.error('[diag-champions] failed:', e)
    return NextResponse.json({ error: String(e) }, { status: 502 })
  }
}
