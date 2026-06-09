import { NextResponse } from 'next/server'
import { writeFileSync, mkdirSync } from 'fs'
import path from 'path'

// Set max execution time (requires Vercel Pro for > 60 s; runs fine in local dev)
export const maxDuration = 300

const API_KEY  = process.env.FOOTBALL_DATA_API_KEY
const BASE_URL = 'https://api.football-data.org/v4'

// football-data.org uses English country/team names — map to ISO 3166-1 alpha-2
const NAME_TO_CODE: Record<string, string> = {
  // CONMEBOL
  Brazil: 'br', Argentina: 'ar', Uruguay: 'uy', Colombia: 'co',
  Ecuador: 'ec', Venezuela: 've', Chile: 'cl', Paraguay: 'py',
  Peru: 'pe', Bolivia: 'bo',
  // CONCACAF
  'United States': 'us', USA: 'us', Mexico: 'mx', Canada: 'ca',
  Panama: 'pa', Honduras: 'hn', Jamaica: 'jm', 'Costa Rica': 'cr',
  'El Salvador': 'sv', 'Trinidad and Tobago': 'tt', Haiti: 'ht',
  Cuba: 'cu', Guatemala: 'gt',
  // UEFA
  France: 'fr', England: 'gb-eng', Spain: 'es', Germany: 'de',
  Portugal: 'pt', Italy: 'it', Netherlands: 'nl', Belgium: 'be',
  Switzerland: 'ch', Croatia: 'hr', Denmark: 'dk', Serbia: 'rs',
  Austria: 'at', Poland: 'pl', 'Czech Republic': 'cz', Czechia: 'cz',
  Turkey: 'tr', Türkiye: 'tr', Ukraine: 'ua', Sweden: 'se', Norway: 'no',
  Scotland: 'gb-sct', Wales: 'gb-wls', Greece: 'gr', Albania: 'al',
  Slovakia: 'sk', Slovenia: 'si', Romania: 'ro', Hungary: 'hu',
  Iceland: 'is', Finland: 'fi', 'Northern Ireland': 'gb-nir',
  'Republic of Ireland': 'ie', Ireland: 'ie', Kosovo: 'xk', Georgia: 'ge',
  'Bosnia and Herzegovina': 'ba', 'North Macedonia': 'mk', Montenegro: 'me',
  Bulgaria: 'bg', Armenia: 'am', Azerbaijan: 'az', Lithuania: 'lt',
  Latvia: 'lv', Estonia: 'ee', Moldova: 'md', Andorra: 'ad',
  // CAF
  Morocco: 'ma', Senegal: 'sn', Nigeria: 'ng', Egypt: 'eg',
  "Côte d'Ivoire": 'ci', 'Ivory Coast': 'ci', Ghana: 'gh', Cameroon: 'cm',
  Tunisia: 'tn', Algeria: 'dz', Mali: 'ml', 'South Africa': 'za',
  Guinea: 'gn', 'Burkina Faso': 'bf', 'DR Congo': 'cd',
  'Democratic Republic of Congo': 'cd', Zimbabwe: 'zw', Uganda: 'ug',
  Tanzania: 'tz', Zambia: 'zm', Angola: 'ao', 'Cape Verde': 'cv',
  Gabon: 'ga', Benin: 'bj', Namibia: 'na', Botswana: 'bw', Liberia: 'lr',
  Ethiopia: 'et', Mozambique: 'mz', Togo: 'tg',
  // AFC
  Japan: 'jp', 'South Korea': 'kr', Iran: 'ir', Australia: 'au',
  'Saudi Arabia': 'sa', Qatar: 'qa', Iraq: 'iq', Jordan: 'jo',
  UAE: 'ae', 'United Arab Emirates': 'ae', Oman: 'om', Bahrain: 'bh',
  Kuwait: 'kw', China: 'cn', Indonesia: 'id', Thailand: 'th',
  Vietnam: 'vn', Malaysia: 'my', India: 'in',
  // OFC
  'New Zealand': 'nz', Fiji: 'fj',
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'X-Auth-Token': API_KEY!, 'Content-Type': 'application/json' },
    cache: 'no-store',
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`football-data ${path} → ${res.status}: ${body}`)
  }
  return res.json() as Promise<T>
}

type FDTeam   = { id: number; name: string; tla: string }
type FDPlayer = { id: number; name: string; position: string; photo?: string }

export async function GET(request: Request) {
  if (!API_KEY) {
    return NextResponse.json(
      { error: 'FOOTBALL_DATA_API_KEY is not set in environment variables' },
      { status: 500 }
    )
  }

  const { searchParams } = new URL(request.url)
  const limitParam = searchParams.get('limit')
  const limit = limitParam ? parseInt(limitParam, 10) : Infinity

  // ── 1. Fetch team list from the competition ─────────────────────────────────
  let teams: FDTeam[] = []
  try {
    let data: { teams?: FDTeam[] }
    try {
      data = await apiFetch<{ teams?: FDTeam[] }>('/competitions/WC/teams')
    } catch {
      // fall back to numeric competition ID
      data = await apiFetch<{ teams?: FDTeam[] }>('/competitions/2000/teams')
    }
    teams = data.teams ?? []
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { error: `Failed to fetch competition teams: ${message}` },
      { status: 502 }
    )
  }

  if (teams.length === 0) {
    return NextResponse.json(
      { error: 'No teams returned — WC 2026 may not be available on this API plan yet.' },
      { status: 404 }
    )
  }

  const batch = teams.slice(0, isFinite(limit) ? limit : teams.length)

  // ── 2. Fetch each team's squad (rate-limited to 10 req/min free tier) ──────
  const players: Array<{
    name: string; country: string; code: string; position: string; photo: string | null
  }> = []

  const errors: Array<{ teamId: number; teamName: string; error: string }> = []

  for (let i = 0; i < batch.length; i++) {
    const team = batch[i]
    if (i > 0) await sleep(6200) // stay under 10 req/min

    try {
      const data = await apiFetch<{ squad?: FDPlayer[] }>(`/teams/${team.id}`)
      const code = NAME_TO_CODE[team.name] ?? 'xx'

      for (const player of data.squad ?? []) {
        if (player.position === 'Attacker' || player.position === 'Midfielder') {
          players.push({
            name:     player.name,
            country:  team.name,
            code,
            position: player.position,
            photo:    player.photo ?? null,
          })
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      errors.push({ teamId: team.id, teamName: team.name, error: message })
    }
  }

  players.sort((a, b) => a.name.localeCompare(b.name))

  const dataDir = path.join(process.cwd(), 'public', 'data')
  mkdirSync(dataDir, { recursive: true })
  const filePath = path.join(dataDir, 'squads.json')
  writeFileSync(filePath, JSON.stringify(players, null, 2))
  console.log(`Saved ${players.length} players to ${filePath}`)

  return NextResponse.json({
    total:   players.length,
    teams:   batch.length,
    errors:  errors.length > 0 ? errors : undefined,
    players,
  })
}
