const PY_TZ = 'America/Asuncion'

const MONTHS_ES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
const MONTHS_SH = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']

function pyParts(d: Date, opts: Intl.DateTimeFormatOptions): Record<string, string> {
  return Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', { timeZone: PY_TZ, ...opts }).formatToParts(d).map(p => [p.type, p.value])
  )
}

// ─── Date/time formatters — America/Asuncion IANA tz, correct on server + client ─

/** "YYYY-MM-DD" in Paraguay timezone */
export function pyISODate(d: Date): string {
  const { year, month, day } = pyParts(d, { year: 'numeric', month: '2-digit', day: '2-digit' })
  return `${year}-${month}-${day}`
}

/** "HH:mm" in Paraguay timezone */
export function pyTime(d: Date): string {
  const { hour, minute } = pyParts(d, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
  return `${hour}:${minute}`
}

/** "11 jun · 16:00" in Paraguay timezone */
export function pyDateTimeMed(d: Date): string {
  const { day, month } = pyParts(d, { day: 'numeric', month: 'numeric' })
  return `${day} ${MONTHS_SH[Number(month) - 1]} · ${pyTime(d)}`
}

/**
 * "Jueves, 11 de junio" from an ISO date key "2026-06-11".
 * Parses at T12:00:00Z so the offset never shifts the calendar date.
 */
export function pyDateLabel(isoDate: string): string {
  const d = new Date(isoDate + 'T12:00:00Z')
  const { day, month } = pyParts(d, { day: 'numeric', month: 'numeric' })
  const weekday = new Intl.DateTimeFormat('es', { timeZone: PY_TZ, weekday: 'long' }).format(d)
  const cap = weekday.charAt(0).toUpperCase() + weekday.slice(1)
  return `${cap}, ${day} de ${MONTHS_ES[Number(month) - 1]}`
}

// ─── Team name translations (English API → Spanish display) ──────────────────

const TEAM_NAMES_ES: Record<string, string> = {
  'South Korea':              'Corea del Sur',
  'Korea Republic':           'Corea del Sur',
  'Korea DPR':                'Corea del Norte',
  'Czechia':                  'República Checa',
  'Czech Republic':           'República Checa',
  'Bosnia-Herzegovina':       'Bosnia y Herzegovina',
  'Bosnia and Herzegovina':   'Bosnia y Herzegovina',
  'United States':            'Estados Unidos',
  'USA':                      'EE.UU.',
  'Saudi Arabia':             'Arabia Saudita',
  'Ivory Coast':              'C. de Marfil',
  "Cote d'Ivoire":            'C. de Marfil',
  'South Africa':             'Sudáfrica',
  'New Zealand':              'Nueva Zelanda',
  'Iran':                     'Irán',
  'Japan':                    'Japón',
  'France':                   'Francia',
  'Germany':                  'Alemania',
  'Spain':                    'España',
  'England':                  'Inglaterra',
  'Netherlands':              'Países Bajos',
  'Belgium':                  'Bélgica',
  'Switzerland':              'Suiza',
  'Croatia':                  'Croacia',
  'Denmark':                  'Dinamarca',
  'Poland':                   'Polonia',
  'Norway':                   'Noruega',
  'Sweden':                   'Suecia',
  'Ukraine':                  'Ucrania',
  'Wales':                    'Gales',
  'Scotland':                 'Escocia',
  'Serbia':                   'Serbia',
  'Austria':                  'Austria',
  'Australia':                'Australia',
  'Canada':                   'Canadá',
  'Mexico':                   'México',
  'Morocco':                  'Marruecos',
  'Senegal':                  'Senegal',
  'Ghana':                    'Ghana',
  'Nigeria':                  'Nigeria',
  'Egypt':                    'Egipto',
  'Tunisia':                  'Túnez',
  'Algeria':                  'Argelia',
  'Cameroon':                 'Camerún',
  'Ecuador':                  'Ecuador',
  'Colombia':                 'Colombia',
  'Uruguay':                  'Uruguay',
  'Paraguay':                 'Paraguay',
  'Venezuela':                'Venezuela',
  'Honduras':                 'Honduras',
  'Qatar':                    'Catar',
  'Jordan':                   'Jordania',
  'Uzbekistan':               'Uzbekistán',
  'Vietnam':                  'Vietnam',
  'Cape Verde':               'Cabo Verde',
  'Curacao':                  'Curazao',
  'Argentina':                'Argentina',
  'Brazil':                   'Brasil',
  'Chile':                    'Chile',
  'Peru':                     'Perú',
  'Bolivia':                  'Bolivia',
  'Italy':                    'Italia',
  'Greece':                   'Grecia',
  'Turkey':                   'Turquía',
  'Russia':                   'Rusia',
  'Romania':                  'Rumania',
  'Hungary':                  'Hungría',
  'Slovenia':                 'Eslovenia',
  'Slovakia':                 'Eslovaquia',
  'Costa Rica':               'Costa Rica',
  'Panama':                   'Panamá',
  'Jamaica':                  'Jamaica',
  'Trinidad and Tobago':      'Trinidad y Tobago',
}

export function getTeamNameES(name: string | null | undefined): string {
  if (!name) return ''
  return TEAM_NAMES_ES[name] ?? name
}
