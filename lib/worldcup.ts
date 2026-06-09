// Paraguay is UTC-3 during the WC (June–July, southern-hemisphere winter, no DST)
const PY_OFFSET_MS = -3 * 60 * 60 * 1000

/** Returns a Date whose getUTC* methods read as Paraguay local time */
function toPY(d: Date): Date {
  return new Date(d.getTime() + PY_OFFSET_MS)
}

const DAYS_ES    = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
const MONTHS_ES  = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
const MONTHS_SH  = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']

// ─── Date/time formatters — pure UTC math, same output on server + client ─────

/** "YYYY-MM-DD" in Paraguay timezone */
export function pyISODate(d: Date): string {
  const py = toPY(d)
  const y  = py.getUTCFullYear()
  const mo = String(py.getUTCMonth() + 1).padStart(2, '0')
  const da = String(py.getUTCDate()).padStart(2, '0')
  return `${y}-${mo}-${da}`
}

/** "HH:mm" in Paraguay timezone */
export function pyTime(d: Date): string {
  const py = toPY(d)
  return `${String(py.getUTCHours()).padStart(2, '0')}:${String(py.getUTCMinutes()).padStart(2, '0')}`
}

/** "11 jun · 22:00" in Paraguay timezone */
export function pyDateTimeMed(d: Date): string {
  const py = toPY(d)
  return `${py.getUTCDate()} ${MONTHS_SH[py.getUTCMonth()]} · ${pyTime(d)}`
}

/**
 * "Jueves, 11 de junio" from an ISO date key "2026-06-11".
 * Parses at T12:00:00Z so the PY-offset never shifts the calendar date.
 */
export function pyDateLabel(isoDate: string): string {
  const py = toPY(new Date(isoDate + 'T12:00:00Z'))
  return `${DAYS_ES[py.getUTCDay()]}, ${py.getUTCDate()} de ${MONTHS_ES[py.getUTCMonth()]}`
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
