import { NextResponse } from 'next/server'
import { fetchWCStandings, getMockStandings } from '@/lib/grupos'

export const revalidate = 3600

export async function GET() {
  const apiData = await fetchWCStandings()
  const isMock = apiData === null
  const groups = isMock ? getMockStandings().total : apiData.total
  return NextResponse.json({ groups, isMock })
}
