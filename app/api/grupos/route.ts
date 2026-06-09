import { NextResponse } from 'next/server'
import { fetchWCStandings, getMockStandings } from '@/lib/grupos'

export const revalidate = 300

export async function GET() {
  const apiData = await fetchWCStandings()
  const isMock = apiData === null
  const groups = isMock ? getMockStandings() : apiData
  return NextResponse.json({ groups, isMock })
}
