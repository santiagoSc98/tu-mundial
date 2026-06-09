// FIFA TLA (3-letter) → ISO 3166-1 alpha-2 for flagcdn.com
export const TLA_TO_ISO: Record<string, string> = {
  ARG: 'ar', BRA: 'br', URU: 'uy', CHI: 'cl', COL: 'co', ECU: 'ec', PER: 'pe',
  VEN: 've', PAR: 'py', BOL: 'bo',
  MEX: 'mx', USA: 'us', CAN: 'ca', CRC: 'cr', PAN: 'pa', HON: 'hn',
  SLV: 'sv', GUA: 'gt', JAM: 'jm', HAI: 'ht', TRI: 'tt', CUB: 'cu',
  FRA: 'fr', ESP: 'es', GER: 'de', POR: 'pt', ITA: 'it', NED: 'nl',
  BEL: 'be', SUI: 'ch', AUT: 'at', POL: 'pl', CZE: 'cz', HUN: 'hu',
  ROU: 'ro', SRB: 'rs', CRO: 'hr', SVK: 'sk', SVN: 'si', DEN: 'dk',
  SWE: 'se', NOR: 'no', FIN: 'fi', ISL: 'is', SCO: 'gb-sct', WAL: 'gb-wls',
  ENG: 'gb-eng', NIR: 'gb-nir', IRL: 'ie', TUR: 'tr', GRE: 'gr',
  UKR: 'ua', BUL: 'bg', ALB: 'al', MNE: 'me', MKD: 'mk', BIH: 'ba',
  GEO: 'ge', ARM: 'am', AZE: 'az', KOS: 'xk', LTU: 'lt', LAT: 'lv', EST: 'ee',
  MAR: 'ma', EGY: 'eg', TUN: 'tn', ALG: 'dz', SEN: 'sn', NGA: 'ng',
  GHA: 'gh', CMR: 'cm', CIV: 'ci', MLI: 'ml', BFA: 'bf', GUI: 'gn',
  COD: 'cd', RSA: 'za', ZIM: 'zw', UGA: 'ug', TAN: 'tz', MOZ: 'mz',
  ZAM: 'zm', ANG: 'ao', CPV: 'cv', GAB: 'ga', BEN: 'bj', TOG: 'tg',
  NAM: 'na', BOT: 'bw', LBR: 'lr', ETH: 'et',
  JPN: 'jp', KOR: 'kr', AUS: 'au', IRN: 'ir', SAU: 'sa', QAT: 'qa',
  UAE: 'ae', IRQ: 'iq', JOR: 'jo', OMN: 'om', BHR: 'bh', KWT: 'kw',
  CHN: 'cn', IDN: 'id', THA: 'th', VIE: 'vn', PHI: 'ph', MAS: 'my',
  NZL: 'nz', FIJ: 'fj', IND: 'in', PAK: 'pk',
  CUW: 'cw', UZB: 'uz',
}

export function getFlagUrl(tla: string | null | undefined): string | null {
  if (!tla) return null
  const iso = TLA_TO_ISO[tla.toUpperCase()]
  return iso ? `https://flagcdn.com/w160/${iso}.png` : null
}
