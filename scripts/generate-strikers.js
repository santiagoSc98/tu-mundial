const fs = require('fs')
const path = require('path')

// TLA → ISO-2 / flagcdn code mapping
const TLA_TO_CODE = {
  URY: 'uy', GER: 'de', ESP: 'es', PAR: 'py', ARG: 'ar', GHA: 'gh',
  BRA: 'br', POR: 'pt', JPN: 'jp', MEX: 'mx', ENG: 'gb-eng', USA: 'us',
  KOR: 'kr', FRA: 'fr', RSA: 'za', ALG: 'dz', AUS: 'au', NZL: 'nz',
  SUI: 'ch', ECU: 'ec', SWE: 'se', CZE: 'cz', CRO: 'hr', KSA: 'sa',
  TUN: 'tn', TUR: 'tr', SEN: 'sn', BEL: 'be', MAR: 'ma', AUT: 'at',
  COL: 'co', EGY: 'eg', CAN: 'ca', HAI: 'ht', IRN: 'ir', BIH: 'ba',
  PAN: 'pa', CPV: 'cv', COD: 'cd', CIV: 'ci', QAT: 'qa', NED: 'nl',
  POL: 'pl', GRE: 'gr', CMR: 'cm', NGA: 'ng', UZB: 'uz', PER: 'pe',
  CHL: 'cl', VEN: 've', BOL: 'bo', CRC: 'cr', HON: 'hn', SLV: 'sv',
  MLI: 'ml', SLE: 'sl', GAM: 'gm', GUI: 'gn', CMR: 'cm', ROU: 'ro',
  HUN: 'hu', SVK: 'sk', SRB: 'rs', SCO: 'gb-sct', WAL: 'gb-wls',
  IRL: 'ie', NOR: 'no', FIN: 'fi', DEN: 'dk', ISL: 'is', SWI: 'ch',
  UKR: 'ua', IRQ: 'iq', OMA: 'om', UAE: 'ae', KUW: 'kw', JOR: 'jo',
  CHN: 'cn', IND: 'in', THA: 'th', IDN: 'id', MYS: 'my', PHI: 'ph',
  NCA: 'ni', TRI: 'tt', CUB: 'cu', GUA: 'gt', HON: 'hn',
}

// Extra colors for new countries
const EXTRA_COLORS = {
  za: '#007A4D', nz: '#00247D', ec: '#FFD100', ht: '#00209F', ba: '#002395',
  cv: '#003893', cd: '#007FFF', nl: '#C05A00', pl: '#DC143C', gr: '#0D5EAF',
  cm: '#007A5E', ng: '#008751', ro: '#002B7F', hu: '#CC0000', sk: '#005DA4',
  rs: '#C6363C', ie: '#169B62', fi: '#003580', dk: '#C60C30', no: '#EF2B2D',
  ua: '#0057B7', iq: '#CC0001', ml: '#14B53A', gn: '#CE1126', sn: '#00A859',
  gm: '#3A7728', sl: '#1EB53A', 'gb-sct': '#003087', 'gb-wls': '#C8102E',
  uz: '#1EB53A', pe: '#D91023', cl: '#D52B1E', ve: '#CF0000', bo: '#007A3D',
  cr: '#002B7F', hn: '#0073CF', sv: '#0F47AF', ni: '#0067A5', tt: '#CE1126',
  cn: '#DE2910',
}

// Read the raw output
const raw = fs.readFileSync(
  '/Users/santiagocampuzano/.claude/projects/-Users-santiagocampuzano-Downloads-predique/9c32be57-a61e-4bb8-b4de-d5187d7c62e9/tool-results/b6gvpsb0h.txt',
  'utf8'
)

// Extract the JSON array from the snippet
const match = raw.match(/export const STRIKERS = \[([\s\S]+?)\]/)
if (!match) { console.error('Could not find STRIKERS array'); process.exit(1) }

// Parse each entry
const entries = []
const lineRe = /\{ name: "([^"]+)", country: "([^"]+)", code: "([^"]+)" \}/g
let m
while ((m = lineRe.exec(match[1])) !== null) {
  const [, name, country, tla] = m
  const code = TLA_TO_CODE[tla.toUpperCase()] ?? tla.toLowerCase()
  entries.push({ name, country, code })
}

console.log(`Parsed ${entries.length} players`)

// Build unique country codes and their colors
const knownColors = {
  ar:'#74ACDF', br:'#009C3B', uy:'#5AAAD4', co:'#C39900', cl:'#D52B1E',
  ec:'#004A97', py:'#CC0000', pe:'#D91023', ve:'#CF0000', bo:'#007A3D',
  mx:'#006847', us:'#0A3161', ca:'#CC0000', cr:'#002B7F', jm:'#1a1a1a',
  pa:'#003082', fr:'#0032A0', 'gb-eng':'#CF0000', es:'#AA151B', de:'#1a1a1a',
  pt:'#006600', be:'#EF2B2D', nl:'#C05A00', hr:'#CC0000', dk:'#C60C30',
  ch:'#CC0000', pl:'#DC143C', se:'#006AA7', ua:'#0057B7', at:'#ED2939',
  'gb-wls':'#C8102E', 'gb-sct':'#003087', no:'#EF2B2D', rs:'#C6363C',
  cz:'#D7141A', tr:'#E30A17', sn:'#00A859', ma:'#C1272D', eg:'#CE1126',
  ng:'#008751', gh:'#006B3F', cm:'#007A5E', ci:'#CC5500', tn:'#E70013',
  dz:'#006233', jp:'#BC002D', kr:'#003478', ir:'#239F40', au:'#00008B',
  sa:'#006C35', qa:'#8D153A', iq:'#CC0001',
  ...EXTRA_COLORS,
}

// Group by country for readability
const byCountry = {}
for (const e of entries) {
  if (!byCountry[e.country]) byCountry[e.country] = []
  byCountry[e.country].push(e)
}

// Build color map (only codes actually used)
const usedCodes = [...new Set(entries.map(e => e.code))]
const colorEntries = usedCodes
  .map(c => `  ${/[^a-z]/.test(c) ? `'${c}'` : c}: '${knownColors[c] ?? '#555555'}',`)
  .join('\n')

// Build strikers array grouped by country
const strikersLines = Object.entries(byCountry).map(([country, players]) => {
  const lines = players.map(p =>
    `  { name: ${JSON.stringify(p.name)}, country: ${JSON.stringify(p.country)}, code: '${p.code}' },`
  ).join('\n')
  return `\n  // ── ${country.toUpperCase()} ${'─'.repeat(Math.max(0, 40 - country.length))}\n${lines}`
}).join('\n')

const output = `export type Striker = { name: string; country: string; code: string; photo?: string | null }

export const PLAYER_COLORS: Record<string, string> = {
${colorEntries}
}

export const STRIKERS: Striker[] = [${strikersLines}
]
`

const outPath = path.join(__dirname, '../lib/strikers.ts')
fs.writeFileSync(outPath, output, 'utf8')
console.log(`✅ Written ${entries.length} players to lib/strikers.ts`)
console.log(`   Countries: ${Object.keys(byCountry).length}`)
