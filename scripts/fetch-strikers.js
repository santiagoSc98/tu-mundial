const TOKEN = '12387c56cd6e459593cef52266141a4b'
const HEADERS = { 'X-Auth-Token': TOKEN }
const DELAY_MS = 7000   // 7s between requests → ~8/min (free tier = 10/min)
const OFFENSIVE = ['Forward', 'Midfielder', 'Offence', 'Midfield', 'Attacking']

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function fetchJSON(url, attempt = 1) {
  const res = await fetch(url, { headers: HEADERS })
  if (res.status === 429) {
    const wait = attempt * 15000
    console.warn(`  ⏳ 429 rate limit, waiting ${wait/1000}s... (attempt ${attempt})`)
    await sleep(wait)
    if (attempt < 5) return fetchJSON(url, attempt + 1)
    throw new Error(`Rate limited after ${attempt} attempts: ${url}`)
  }
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`)
  return res.json()
}

async function main() {
  console.log('Fetching World Cup 2026 teams...')
  const data = await fetchJSON(
    'https://api.football-data.org/v4/competitions/2000/teams?season=2026'
  )
  const teams = data.teams ?? []
  console.log(`Found ${teams.length} teams — fetching squads (7s between each)...\n`)

  const results = []

  for (let i = 0; i < teams.length; i++) {
    const team = teams[i]
    process.stdout.write(`[${i+1}/${teams.length}] ${team.name}... `)
    try {
      const teamData = await fetchJSON(`https://api.football-data.org/v4/teams/${team.id}`)
      const squad = teamData.squad ?? []
      const offensive = squad.filter(p =>
        OFFENSIVE.some(pos => (p.position ?? '').toLowerCase().includes(pos.toLowerCase()))
      )
      console.log(`${squad.length} players, ${offensive.length} offensive`)
      for (const p of offensive) {
        results.push({ name: p.name, team: team.name, country: team.tla ?? '' })
      }
    } catch(e) {
      console.log(`SKIPPED — ${e.message}`)
    }
    if (i < teams.length - 1) await sleep(DELAY_MS)
  }

  console.log(`\n${'─'.repeat(60)}`)
  console.log(`TOTAL: ${results.length} offensive players from ${teams.length} teams`)
  console.log(`${'─'.repeat(60)}\n`)

  results.forEach((p, i) =>
    console.log(`  ${String(i+1).padStart(3)}. ${p.name.padEnd(30)} | ${p.team.padEnd(22)} | ${p.country}`)
  )

  // Output TypeScript snippet
  const tsLines = results.map((p, i) =>
    `  { name: ${JSON.stringify(p.name)}, country: ${JSON.stringify(p.team)}, code: ${JSON.stringify(p.country.toLowerCase())} },`
  ).join('\n')
  console.log(`\n// ─── strikers.ts snippet ───\nexport const STRIKERS = [\n${tsLines}\n]`)
}

main().catch(e => { console.error('Fatal:', e); process.exit(1) })
