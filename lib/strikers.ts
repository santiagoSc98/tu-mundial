export type Striker = { name: string; country: string; code: string; photo?: string | null }

export const PLAYER_COLORS: Record<string, string> = {
  ar: '#74ACDF',
  br: '#009C3B',
  uy: '#5AAAD4',
  co: '#C39900',
  cl: '#D52B1E',
  ec: '#004A97',
  py: '#CC0000',
  pe: '#D91023',
  ve: '#CF0000',
  bo: '#007A3D',
  mx: '#006847',
  us: '#0A3161',
  ca: '#CC0000',
  cr: '#002B7F',
  jm: '#1a1a1a',
  pa: '#003082',
  fr: '#0032A0',
  'gb-eng': '#CF0000',
  es: '#AA151B',
  de: '#1a1a1a',
  pt: '#006600',
  be: '#EF2B2D',
  nl: '#C05A00',
  it: '#009246',
  hr: '#CC0000',
  dk: '#C60C30',
  ch: '#CC0000',
  pl: '#DC143C',
  se: '#006AA7',
  ua: '#0057B7',
  at: '#ED2939',
  'gb-wls': '#C8102E',
  'gb-sct': '#003087',
  no: '#EF2B2D',
  rs: '#C6363C',
  cz: '#D7141A',
  tr: '#E30A17',
  sn: '#00A859',
  ma: '#C1272D',
  eg: '#CE1126',
  ng: '#008751',
  gh: '#006B3F',
  cm: '#007A5E',
  ci: '#CC5500',
  tn: '#E70013',
  dz: '#006233',
  jp: '#BC002D',
  kr: '#003478',
  ir: '#239F40',
  au: '#00008B',
  sa: '#006C35',
  qa: '#8D153A',
  iq: '#CC0001',
}

export const STRIKERS: Striker[] = [
  // ── CONMEBOL ─────────────────────────────────────────────
  { name: 'Lionel Messi',          country: 'Argentina',      code: 'ar' },
  { name: 'Lautaro Martínez',      country: 'Argentina',      code: 'ar' },
  { name: 'Julián Álvarez',        country: 'Argentina',      code: 'ar' },
  { name: 'Paulo Dybala',          country: 'Argentina',      code: 'ar' },
  { name: 'Ángel Di María',        country: 'Argentina',      code: 'ar' },
  { name: 'Ángel Correa',          country: 'Argentina',      code: 'ar' },
  { name: 'Joaquín Correa',        country: 'Argentina',      code: 'ar' },
  { name: 'Nicolás González',      country: 'Argentina',      code: 'ar' },
  { name: 'Alexis Mac Allister',   country: 'Argentina',      code: 'ar' },
  { name: 'Enzo Fernández',        country: 'Argentina',      code: 'ar' },

  { name: 'Neymar Jr',             country: 'Brasil',         code: 'br' },
  { name: 'Vinícius Jr',           country: 'Brasil',         code: 'br' },
  { name: 'Rodrygo',               country: 'Brasil',         code: 'br' },
  { name: 'Richarlison',           country: 'Brasil',         code: 'br' },
  { name: 'Gabriel Jesus',         country: 'Brasil',         code: 'br' },
  { name: 'Raphinha',              country: 'Brasil',         code: 'br' },
  { name: 'Antony',                country: 'Brasil',         code: 'br' },
  { name: 'Gabriel Martinelli',    country: 'Brasil',         code: 'br' },
  { name: 'Pedro',                 country: 'Brasil',         code: 'br' },
  { name: 'Matheus Cunha',         country: 'Brasil',         code: 'br' },

  { name: 'Luis Suárez',           country: 'Uruguay',        code: 'uy' },
  { name: 'Edinson Cavani',        country: 'Uruguay',        code: 'uy' },
  { name: 'Darwin Núñez',          country: 'Uruguay',        code: 'uy' },
  { name: 'Facundo Pellistri',     country: 'Uruguay',        code: 'uy' },
  { name: 'Agustín Canobbio',      country: 'Uruguay',        code: 'uy' },

  { name: 'Luis Díaz',             country: 'Colombia',       code: 'co' },
  { name: 'Rafael Santos Borré',   country: 'Colombia',       code: 'co' },
  { name: 'Duván Zapata',          country: 'Colombia',       code: 'co' },
  { name: 'Jhon Durán',            country: 'Colombia',       code: 'co' },
  { name: 'Luis Sinisterra',       country: 'Colombia',       code: 'co' },
  { name: 'Juan Fernando Quintero',country: 'Colombia',       code: 'co' },

  { name: 'Alexis Sánchez',        country: 'Chile',          code: 'cl' },
  { name: 'Ben Brereton',          country: 'Chile',          code: 'cl' },
  { name: 'Eduardo Vargas',        country: 'Chile',          code: 'cl' },

  { name: 'Enner Valencia',        country: 'Ecuador',        code: 'ec' },
  { name: 'Gonzalo Plata',         country: 'Ecuador',        code: 'ec' },
  { name: 'Michael Estrada',       country: 'Ecuador',        code: 'ec' },

  { name: 'Miguel Almirón',        country: 'Paraguay',       code: 'py' },
  { name: 'Ángel Romero',          country: 'Paraguay',       code: 'py' },
  { name: 'Julio Enciso',          country: 'Paraguay',       code: 'py' },

  { name: 'Paolo Guerrero',        country: 'Perú',           code: 'pe' },
  { name: 'Gianluca Lapadula',     country: 'Perú',           code: 'pe' },

  { name: 'Salomón Rondón',        country: 'Venezuela',      code: 've' },
  { name: 'Josef Martínez',        country: 'Venezuela',      code: 've' },

  { name: 'Marcelo Moreno',        country: 'Bolivia',        code: 'bo' },

  // ── CONCACAF ──────────────────────────────────────────────
  { name: 'Hirving Lozano',        country: 'México',         code: 'mx' },
  { name: 'Raúl Jiménez',          country: 'México',         code: 'mx' },
  { name: 'Santiago Giménez',      country: 'México',         code: 'mx' },
  { name: 'Alexis Vega',           country: 'México',         code: 'mx' },
  { name: 'Henry Martín',          country: 'México',         code: 'mx' },
  { name: 'Orbelín Pineda',        country: 'México',         code: 'mx' },

  { name: 'Christian Pulisic',     country: 'Estados Unidos', code: 'us' },
  { name: 'Gio Reyna',             country: 'Estados Unidos', code: 'us' },
  { name: 'Timothy Weah',          country: 'Estados Unidos', code: 'us' },
  { name: 'Ricardo Pepi',          country: 'Estados Unidos', code: 'us' },
  { name: 'Folarin Balogun',       country: 'Estados Unidos', code: 'us' },
  { name: 'Josh Sargent',          country: 'Estados Unidos', code: 'us' },
  { name: 'Brenden Aaronson',      country: 'Estados Unidos', code: 'us' },

  { name: 'Alphonso Davies',       country: 'Canadá',         code: 'ca' },
  { name: 'Jonathan David',        country: 'Canadá',         code: 'ca' },
  { name: 'Cyle Larin',            country: 'Canadá',         code: 'ca' },
  { name: 'Tajon Buchanan',        country: 'Canadá',         code: 'ca' },

  { name: 'Joel Campbell',         country: 'Costa Rica',     code: 'cr' },
  { name: 'Anthony Contreras',     country: 'Costa Rica',     code: 'cr' },

  { name: 'Michail Antonio',       country: 'Jamaica',        code: 'jm' },
  { name: 'Leon Bailey',           country: 'Jamaica',        code: 'jm' },

  { name: 'Ismael Díaz',           country: 'Panamá',         code: 'pa' },
  { name: 'José Fajardo',          country: 'Panamá',         code: 'pa' },

  // ── UEFA ──────────────────────────────────────────────────
  { name: 'Kylian Mbappé',         country: 'Francia',        code: 'fr' },
  { name: 'Antoine Griezmann',     country: 'Francia',        code: 'fr' },
  { name: 'Karim Benzema',         country: 'Francia',        code: 'fr' },
  { name: 'Olivier Giroud',        country: 'Francia',        code: 'fr' },
  { name: 'Ousmane Dembélé',       country: 'Francia',        code: 'fr' },
  { name: 'Kingsley Coman',        country: 'Francia',        code: 'fr' },
  { name: 'Marcus Thuram',         country: 'Francia',        code: 'fr' },
  { name: 'Randal Kolo Muani',     country: 'Francia',        code: 'fr' },

  { name: 'Harry Kane',            country: 'Inglaterra',     code: 'gb-eng' },
  { name: 'Raheem Sterling',       country: 'Inglaterra',     code: 'gb-eng' },
  { name: 'Phil Foden',            country: 'Inglaterra',     code: 'gb-eng' },
  { name: 'Bukayo Saka',           country: 'Inglaterra',     code: 'gb-eng' },
  { name: 'Marcus Rashford',       country: 'Inglaterra',     code: 'gb-eng' },
  { name: 'Jack Grealish',         country: 'Inglaterra',     code: 'gb-eng' },
  { name: 'James Maddison',        country: 'Inglaterra',     code: 'gb-eng' },
  { name: 'Callum Wilson',         country: 'Inglaterra',     code: 'gb-eng' },

  { name: 'Álvaro Morata',         country: 'España',         code: 'es' },
  { name: 'Ferran Torres',         country: 'España',         code: 'es' },
  { name: 'Dani Olmo',             country: 'España',         code: 'es' },
  { name: 'Mikel Oyarzabal',       country: 'España',         code: 'es' },
  { name: 'Ansu Fati',             country: 'España',         code: 'es' },
  { name: 'Yeremy Pino',           country: 'España',         code: 'es' },
  { name: 'Pedri',                 country: 'España',         code: 'es' },

  { name: 'Thomas Müller',         country: 'Alemania',       code: 'de' },
  { name: 'Serge Gnabry',          country: 'Alemania',       code: 'de' },
  { name: 'Leroy Sané',            country: 'Alemania',       code: 'de' },
  { name: 'Kai Havertz',           country: 'Alemania',       code: 'de' },
  { name: 'Jamal Musiala',         country: 'Alemania',       code: 'de' },
  { name: 'Niclas Füllkrug',       country: 'Alemania',       code: 'de' },
  { name: 'Timo Werner',           country: 'Alemania',       code: 'de' },

  { name: 'Cristiano Ronaldo',     country: 'Portugal',       code: 'pt' },
  { name: 'Bruno Fernandes',       country: 'Portugal',       code: 'pt' },
  { name: 'Bernardo Silva',        country: 'Portugal',       code: 'pt' },
  { name: 'João Félix',            country: 'Portugal',       code: 'pt' },
  { name: 'Rafael Leão',           country: 'Portugal',       code: 'pt' },
  { name: 'Diogo Jota',            country: 'Portugal',       code: 'pt' },
  { name: 'Gonçalo Ramos',         country: 'Portugal',       code: 'pt' },

  { name: 'Romelu Lukaku',         country: 'Bélgica',        code: 'be' },
  { name: 'Eden Hazard',           country: 'Bélgica',        code: 'be' },
  { name: 'Dries Mertens',         country: 'Bélgica',        code: 'be' },
  { name: 'Loïs Openda',           country: 'Bélgica',        code: 'be' },
  { name: 'Jérémy Doku',           country: 'Bélgica',        code: 'be' },
  { name: 'Leandro Trossard',      country: 'Bélgica',        code: 'be' },

  { name: 'Memphis Depay',         country: 'Países Bajos',   code: 'nl' },
  { name: 'Cody Gakpo',            country: 'Países Bajos',   code: 'nl' },
  { name: 'Steven Bergwijn',       country: 'Países Bajos',   code: 'nl' },
  { name: 'Wout Weghorst',         country: 'Países Bajos',   code: 'nl' },

  { name: 'Ciro Immobile',         country: 'Italia',         code: 'it' },
  { name: 'Federico Chiesa',       country: 'Italia',         code: 'it' },
  { name: 'Giacomo Raspadori',     country: 'Italia',         code: 'it' },
  { name: 'Gianluca Scamacca',     country: 'Italia',         code: 'it' },
  { name: 'Lorenzo Insigne',       country: 'Italia',         code: 'it' },

  { name: 'Ivan Perišić',          country: 'Croacia',        code: 'hr' },
  { name: 'Andrej Kramarić',       country: 'Croacia',        code: 'hr' },
  { name: 'Bruno Petković',        country: 'Croacia',        code: 'hr' },

  { name: 'Kasper Dolberg',        country: 'Dinamarca',      code: 'dk' },
  { name: 'Yussuf Poulsen',        country: 'Dinamarca',      code: 'dk' },
  { name: 'Rasmus Hojlund',        country: 'Dinamarca',      code: 'dk' },

  { name: 'Breel Embolo',          country: 'Suiza',          code: 'ch' },
  { name: 'Xherdan Shaqiri',       country: 'Suiza',          code: 'ch' },
  { name: 'Haris Seferović',       country: 'Suiza',          code: 'ch' },

  { name: 'Robert Lewandowski',    country: 'Polonia',        code: 'pl' },
  { name: 'Arkadiusz Milik',       country: 'Polonia',        code: 'pl' },
  { name: 'Krzysztof Piątek',      country: 'Polonia',        code: 'pl' },

  { name: 'Alexander Isak',        country: 'Suecia',         code: 'se' },
  { name: 'Viktor Gyökeres',       country: 'Suecia',         code: 'se' },
  { name: 'Dejan Kulusevski',      country: 'Suecia',         code: 'se' },

  { name: 'Artem Dovbyk',          country: 'Ucrania',        code: 'ua' },
  { name: 'Roman Yaremchuk',       country: 'Ucrania',        code: 'ua' },
  { name: 'Mykhailo Mudryk',       country: 'Ucrania',        code: 'ua' },

  { name: 'Marko Arnautović',      country: 'Austria',        code: 'at' },
  { name: 'Michael Gregoritsch',   country: 'Austria',        code: 'at' },

  { name: 'Gareth Bale',           country: 'Gales',          code: 'gb-wls' },
  { name: 'Kieffer Moore',         country: 'Gales',          code: 'gb-wls' },
  { name: 'Daniel James',          country: 'Gales',          code: 'gb-wls' },

  { name: 'Che Adams',             country: 'Escocia',        code: 'gb-sct' },
  { name: 'Lyndon Dykes',          country: 'Escocia',        code: 'gb-sct' },

  { name: 'Erling Haaland',        country: 'Noruega',        code: 'no' },
  { name: 'Alexander Sørloth',     country: 'Noruega',        code: 'no' },

  { name: 'Dušan Vlahović',        country: 'Serbia',         code: 'rs' },
  { name: 'Aleksandar Mitrović',   country: 'Serbia',         code: 'rs' },

  { name: 'Patrik Schick',         country: 'Rep. Checa',     code: 'cz' },
  { name: 'Adam Hložek',           country: 'Rep. Checa',     code: 'cz' },

  { name: 'Cengiz Ünder',          country: 'Turquía',        code: 'tr' },
  { name: 'Burak Yılmaz',          country: 'Turquía',        code: 'tr' },

  // ── CAF ───────────────────────────────────────────────────
  { name: 'Sadio Mané',            country: 'Senegal',        code: 'sn' },
  { name: 'Boulaye Dia',           country: 'Senegal',        code: 'sn' },
  { name: 'Ismaïla Sarr',          country: 'Senegal',        code: 'sn' },
  { name: 'Nicolas Jackson',       country: 'Senegal',        code: 'sn' },

  { name: 'Youssef En-Nesyri',     country: 'Marruecos',      code: 'ma' },
  { name: 'Hakim Ziyech',          country: 'Marruecos',      code: 'ma' },
  { name: 'Sofiane Boufal',        country: 'Marruecos',      code: 'ma' },

  { name: 'Mohamed Salah',         country: 'Egipto',         code: 'eg' },
  { name: 'Mostafa Mohamed',       country: 'Egipto',         code: 'eg' },

  { name: 'Victor Osimhen',        country: 'Nigeria',        code: 'ng' },
  { name: 'Ademola Lookman',       country: 'Nigeria',        code: 'ng' },
  { name: 'Samuel Chukwueze',      country: 'Nigeria',        code: 'ng' },

  { name: 'Jordan Ayew',           country: 'Ghana',          code: 'gh' },
  { name: 'Iñaki Williams',        country: 'Ghana',          code: 'gh' },
  { name: 'Mohammed Kudus',        country: 'Ghana',          code: 'gh' },

  { name: 'Vincent Aboubakar',     country: 'Camerún',        code: 'cm' },
  { name: 'Karl Toko Ekambi',      country: 'Camerún',        code: 'cm' },
  { name: 'Eric Maxim Choupo-Moting', country: 'Camerún',    code: 'cm' },

  { name: 'Sébastien Haller',      country: 'Costa de Marfil', code: 'ci' },
  { name: 'Nicolas Pépé',          country: 'Costa de Marfil', code: 'ci' },

  { name: 'Wahbi Khazri',          country: 'Túnez',          code: 'tn' },
  { name: 'Youssef Msakni',        country: 'Túnez',          code: 'tn' },

  { name: 'Riyad Mahrez',          country: 'Argelia',        code: 'dz' },
  { name: 'Islam Slimani',         country: 'Argelia',        code: 'dz' },

  // ── AFC ───────────────────────────────────────────────────
  { name: 'Takumi Minamino',       country: 'Japón',          code: 'jp' },
  { name: 'Takefusa Kubo',         country: 'Japón',          code: 'jp' },
  { name: 'Kaoru Mitoma',          country: 'Japón',          code: 'jp' },
  { name: 'Daizen Maeda',          country: 'Japón',          code: 'jp' },

  { name: 'Son Heung-min',         country: 'Corea del Sur',  code: 'kr' },
  { name: 'Hwang Hee-chan',        country: 'Corea del Sur',  code: 'kr' },
  { name: 'Cho Gue-sung',          country: 'Corea del Sur',  code: 'kr' },

  { name: 'Mehdi Taremi',          country: 'Irán',           code: 'ir' },
  { name: 'Sardar Azmoun',         country: 'Irán',           code: 'ir' },

  { name: 'Mathew Leckie',         country: 'Australia',      code: 'au' },
  { name: 'Jamie Maclaren',        country: 'Australia',      code: 'au' },
  { name: 'Ajdin Hrustic',         country: 'Australia',      code: 'au' },

  { name: 'Salem Al-Dawsari',      country: 'Arabia Saudita', code: 'sa' },
  { name: 'Fahad Al-Muwallad',     country: 'Arabia Saudita', code: 'sa' },

  { name: 'Almoez Ali',            country: 'Catar',          code: 'qa' },
  { name: 'Akram Afif',            country: 'Catar',          code: 'qa' },
]
