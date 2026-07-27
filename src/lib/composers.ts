export type Period =
  | 'Renaissance'
  | 'Baroque'
  | 'Classical'
  | 'Romantic'
  | 'Modern'

export interface Composer {
  /** URL slug, e.g. 'bach' */
  slug: string
  /** Display name, e.g. 'Johann Sebastian Bach' */
  name: string
  /** Short form for compact UI, e.g. 'Bach' */
  surname: string
  born?: number
  died?: number
  period: Period
  nationality?: string
  /** Lowercase strings that should resolve to this composer when parsing. */
  aliases: string[]
}

export const periods: { slug: string; name: Period; range: string; blurb: string }[] = [
  {
    slug: 'renaissance',
    name: 'Renaissance',
    range: 'to 1600',
    blurb: 'Interweaving vocal lines and early instrumental forms.',
  },
  {
    slug: 'baroque',
    name: 'Baroque',
    range: '1600–1750',
    blurb: 'Counterpoint, ornament and the rise of the concerto.',
  },
  {
    slug: 'classical',
    name: 'Classical',
    range: '1750–1820',
    blurb: 'Clarity and balance; the symphony and string quartet take shape.',
  },
  {
    slug: 'romantic',
    name: 'Romantic',
    range: '1820–1900',
    blurb: 'Expanded orchestras, nationalism and personal expression.',
  },
  {
    slug: 'modern',
    name: 'Modern',
    range: '1900 onwards',
    blurb: 'New harmonic languages and rhythmic freedom.',
  },
]

/**
 * Curated composer reference. Catalog metadata gives us names in wildly
 * different forms ('Johann Sebastian Bach', 'Bach', 'J.S. Bach'), so aliases
 * drive canonicalisation and this table supplies the dates and period that the
 * source data never provides.
 */
export const composers: Composer[] = [
  // --- Renaissance ---
  { slug: 'palestrina', name: 'Giovanni Pierluigi da Palestrina', surname: 'Palestrina', born: 1525, died: 1594, period: 'Renaissance', nationality: 'Italian', aliases: ['palestrina'] },
  { slug: 'tallis', name: 'Thomas Tallis', surname: 'Tallis', born: 1505, died: 1585, period: 'Renaissance', nationality: 'English', aliases: ['tallis'] },
  { slug: 'byrd', name: 'William Byrd', surname: 'Byrd', born: 1543, died: 1623, period: 'Renaissance', nationality: 'English', aliases: ['byrd'] },
  { slug: 'monteverdi', name: 'Claudio Monteverdi', surname: 'Monteverdi', born: 1567, died: 1643, period: 'Renaissance', nationality: 'Italian', aliases: ['monteverdi'] },

  // --- Baroque ---
  { slug: 'purcell', name: 'Henry Purcell', surname: 'Purcell', born: 1659, died: 1695, period: 'Baroque', nationality: 'English', aliases: ['purcell'] },
  { slug: 'corelli', name: 'Arcangelo Corelli', surname: 'Corelli', born: 1653, died: 1713, period: 'Baroque', nationality: 'Italian', aliases: ['corelli'] },
  { slug: 'pachelbel', name: 'Johann Pachelbel', surname: 'Pachelbel', born: 1653, died: 1706, period: 'Baroque', nationality: 'German', aliases: ['pachelbel'] },
  { slug: 'albinoni', name: 'Tomaso Albinoni', surname: 'Albinoni', born: 1671, died: 1751, period: 'Baroque', nationality: 'Italian', aliases: ['albinoni'] },
  { slug: 'vivaldi', name: 'Antonio Vivaldi', surname: 'Vivaldi', born: 1678, died: 1741, period: 'Baroque', nationality: 'Italian', aliases: ['vivaldi'] },
  { slug: 'telemann', name: 'Georg Philipp Telemann', surname: 'Telemann', born: 1681, died: 1767, period: 'Baroque', nationality: 'German', aliases: ['telemann'] },
  { slug: 'bach', name: 'Johann Sebastian Bach', surname: 'Bach', born: 1685, died: 1750, period: 'Baroque', nationality: 'German', aliases: ['bach', 'johann sebastian bach', 'j.s. bach', 'js bach', 'j. s. bach', 'bach, johann sebastian'] },
  { slug: 'handel', name: 'George Frideric Handel', surname: 'Handel', born: 1685, died: 1759, period: 'Baroque', nationality: 'German-British', aliases: ['handel', 'haendel', 'händel', 'george frideric handel'] },
  { slug: 'scarlatti', name: 'Domenico Scarlatti', surname: 'Scarlatti', born: 1685, died: 1757, period: 'Baroque', nationality: 'Italian', aliases: ['scarlatti', 'domenico scarlatti'] },
  { slug: 'gluck', name: 'Christoph Willibald Gluck', surname: 'Gluck', born: 1714, died: 1787, period: 'Baroque', nationality: 'German', aliases: ['gluck'] },

  // --- Classical ---
  { slug: 'haydn', name: 'Joseph Haydn', surname: 'Haydn', born: 1732, died: 1809, period: 'Classical', nationality: 'Austrian', aliases: ['haydn', 'joseph haydn', 'franz joseph haydn'] },
  { slug: 'boccherini', name: 'Luigi Boccherini', surname: 'Boccherini', born: 1743, died: 1805, period: 'Classical', nationality: 'Italian', aliases: ['boccherini'] },
  { slug: 'mozart', name: 'Wolfgang Amadeus Mozart', surname: 'Mozart', born: 1756, died: 1791, period: 'Classical', nationality: 'Austrian', aliases: ['mozart', 'wolfgang amadeus mozart', 'w.a. mozart', 'wa mozart'] },
  { slug: 'clementi', name: 'Muzio Clementi', surname: 'Clementi', born: 1752, died: 1832, period: 'Classical', nationality: 'Italian', aliases: ['clementi'] },
  { slug: 'beethoven', name: 'Ludwig van Beethoven', surname: 'Beethoven', born: 1770, died: 1827, period: 'Classical', nationality: 'German', aliases: ['beethoven', 'ludwig van beethoven', 'van beethoven'] },
  { slug: 'weber', name: 'Carl Maria von Weber', surname: 'Weber', born: 1786, died: 1826, period: 'Classical', nationality: 'German', aliases: ['weber', 'carl maria von weber'] },

  // --- Romantic ---
  { slug: 'rossini', name: 'Gioachino Rossini', surname: 'Rossini', born: 1792, died: 1868, period: 'Romantic', nationality: 'Italian', aliases: ['rossini'] },
  { slug: 'schubert', name: 'Franz Schubert', surname: 'Schubert', born: 1797, died: 1828, period: 'Romantic', nationality: 'Austrian', aliases: ['schubert', 'franz schubert'] },
  { slug: 'donizetti', name: 'Gaetano Donizetti', surname: 'Donizetti', born: 1797, died: 1848, period: 'Romantic', nationality: 'Italian', aliases: ['donizetti'] },
  { slug: 'berlioz', name: 'Hector Berlioz', surname: 'Berlioz', born: 1803, died: 1869, period: 'Romantic', nationality: 'French', aliases: ['berlioz'] },
  { slug: 'mendelssohn', name: 'Felix Mendelssohn', surname: 'Mendelssohn', born: 1809, died: 1847, period: 'Romantic', nationality: 'German', aliases: ['mendelssohn', 'felix mendelssohn'] },
  { slug: 'chopin', name: 'Frédéric Chopin', surname: 'Chopin', born: 1810, died: 1849, period: 'Romantic', nationality: 'Polish', aliases: ['chopin', 'frederic chopin', 'frédéric chopin', 'f. chopin'] },
  { slug: 'schumann', name: 'Robert Schumann', surname: 'Schumann', born: 1810, died: 1856, period: 'Romantic', nationality: 'German', aliases: ['schumann', 'robert schumann'] },
  { slug: 'liszt', name: 'Franz Liszt', surname: 'Liszt', born: 1811, died: 1886, period: 'Romantic', nationality: 'Hungarian', aliases: ['liszt', 'franz liszt'] },
  { slug: 'wagner', name: 'Richard Wagner', surname: 'Wagner', born: 1813, died: 1883, period: 'Romantic', nationality: 'German', aliases: ['wagner', 'richard wagner'] },
  { slug: 'verdi', name: 'Giuseppe Verdi', surname: 'Verdi', born: 1813, died: 1901, period: 'Romantic', nationality: 'Italian', aliases: ['verdi', 'giuseppe verdi'] },
  { slug: 'franck', name: 'César Franck', surname: 'Franck', born: 1822, died: 1890, period: 'Romantic', nationality: 'Belgian-French', aliases: ['franck', 'cesar franck', 'césar franck'] },
  { slug: 'smetana', name: 'Bedřich Smetana', surname: 'Smetana', born: 1824, died: 1884, period: 'Romantic', nationality: 'Czech', aliases: ['smetana', 'bedrich smetana', 'bedřich smetana'] },
  { slug: 'bruckner', name: 'Anton Bruckner', surname: 'Bruckner', born: 1824, died: 1896, period: 'Romantic', nationality: 'Austrian', aliases: ['bruckner'] },
  { slug: 'strauss-ii', name: 'Johann Strauss II', surname: 'Strauss II', born: 1825, died: 1899, period: 'Romantic', nationality: 'Austrian', aliases: ['johann strauss ii', 'johann strauss jr', 'johann strauss', 'j. strauss ii', 'j. strauss', 'j strauss'] },
  { slug: 'borodin', name: 'Alexander Borodin', surname: 'Borodin', born: 1833, died: 1887, period: 'Romantic', nationality: 'Russian', aliases: ['borodin', 'alexander borodin'] },
  { slug: 'brahms', name: 'Johannes Brahms', surname: 'Brahms', born: 1833, died: 1897, period: 'Romantic', nationality: 'German', aliases: ['brahms', 'johannes brahms'] },
  { slug: 'saint-saens', name: 'Camille Saint-Saëns', surname: 'Saint-Saëns', born: 1835, died: 1921, period: 'Romantic', nationality: 'French', aliases: ['saint-saens', 'saint saens', 'saint-saëns', 'camille saint-saens'] },
  { slug: 'bizet', name: 'Georges Bizet', surname: 'Bizet', born: 1838, died: 1875, period: 'Romantic', nationality: 'French', aliases: ['bizet'] },
  { slug: 'bruch', name: 'Max Bruch', surname: 'Bruch', born: 1838, died: 1920, period: 'Romantic', nationality: 'German', aliases: ['bruch'] },
  { slug: 'mussorgsky', name: 'Modest Mussorgsky', surname: 'Mussorgsky', born: 1839, died: 1881, period: 'Romantic', nationality: 'Russian', aliases: ['mussorgsky', 'moussorgsky'] },
  { slug: 'tchaikovsky', name: 'Pyotr Ilyich Tchaikovsky', surname: 'Tchaikovsky', born: 1840, died: 1893, period: 'Romantic', nationality: 'Russian', aliases: ['tchaikovsky', 'tschaikowsky', 'pyotr ilyich tchaikovsky', 'peter tchaikovsky'] },
  { slug: 'dvorak', name: 'Antonín Dvořák', surname: 'Dvořák', born: 1841, died: 1904, period: 'Romantic', nationality: 'Czech', aliases: ['dvorak', 'dvořák', 'antonin dvorak', 'antonín dvořák'] },
  { slug: 'grieg', name: 'Edvard Grieg', surname: 'Grieg', born: 1843, died: 1907, period: 'Romantic', nationality: 'Norwegian', aliases: ['grieg', 'edvard grieg'] },
  { slug: 'rimsky-korsakov', name: 'Nikolai Rimsky-Korsakov', surname: 'Rimsky-Korsakov', born: 1844, died: 1908, period: 'Romantic', nationality: 'Russian', aliases: ['rimsky-korsakov', 'rimsky korsakov', 'nikolai rimsky-korsakov'] },
  { slug: 'faure', name: 'Gabriel Fauré', surname: 'Fauré', born: 1845, died: 1924, period: 'Romantic', nationality: 'French', aliases: ['faure', 'fauré', 'gabriel faure'] },
  { slug: 'elgar', name: 'Edward Elgar', surname: 'Elgar', born: 1857, died: 1934, period: 'Romantic', nationality: 'English', aliases: ['elgar', 'edward elgar'] },
  { slug: 'puccini', name: 'Giacomo Puccini', surname: 'Puccini', born: 1858, died: 1924, period: 'Romantic', nationality: 'Italian', aliases: ['puccini'] },
  { slug: 'mahler', name: 'Gustav Mahler', surname: 'Mahler', born: 1860, died: 1911, period: 'Romantic', nationality: 'Austrian', aliases: ['mahler', 'gustav mahler'] },
  { slug: 'debussy', name: 'Claude Debussy', surname: 'Debussy', born: 1862, died: 1918, period: 'Romantic', nationality: 'French', aliases: ['debussy', 'claude debussy'] },
  { slug: 'strauss-r', name: 'Richard Strauss', surname: 'R. Strauss', born: 1864, died: 1949, period: 'Romantic', nationality: 'German', aliases: ['richard strauss', 'r. strauss', 'r strauss'] },
  { slug: 'sibelius', name: 'Jean Sibelius', surname: 'Sibelius', born: 1865, died: 1957, period: 'Romantic', nationality: 'Finnish', aliases: ['sibelius', 'jean sibelius'] },
  { slug: 'satie', name: 'Erik Satie', surname: 'Satie', born: 1866, died: 1925, period: 'Romantic', nationality: 'French', aliases: ['satie', 'erik satie'] },
  { slug: 'suk', name: 'Josef Suk', surname: 'Suk', born: 1874, died: 1935, period: 'Romantic', nationality: 'Czech', aliases: ['suk', 'josef suk'] },

  // --- Modern ---
  { slug: 'rachmaninoff', name: 'Sergei Rachmaninoff', surname: 'Rachmaninoff', born: 1873, died: 1943, period: 'Modern', nationality: 'Russian', aliases: ['rachmaninoff', 'rachmaninov', 'sergei rachmaninoff'] },
  { slug: 'holst', name: 'Gustav Holst', surname: 'Holst', born: 1874, died: 1934, period: 'Modern', nationality: 'English', aliases: ['holst', 'gustav holst'] },
  { slug: 'ravel', name: 'Maurice Ravel', surname: 'Ravel', born: 1875, died: 1937, period: 'Modern', nationality: 'French', aliases: ['ravel', 'maurice ravel'] },
  { slug: 'vaughan-williams', name: 'Ralph Vaughan Williams', surname: 'Vaughan Williams', born: 1872, died: 1958, period: 'Modern', nationality: 'English', aliases: ['vaughan williams', 'ralph vaughan williams'] },
  { slug: 'stravinsky', name: 'Igor Stravinsky', surname: 'Stravinsky', born: 1882, died: 1971, period: 'Modern', nationality: 'Russian', aliases: ['stravinsky', 'igor stravinsky'] },
  { slug: 'prokofiev', name: 'Sergei Prokofiev', surname: 'Prokofiev', born: 1891, died: 1953, period: 'Modern', nationality: 'Russian', aliases: ['prokofiev', 'sergei prokofiev'] },
  { slug: 'gershwin', name: 'George Gershwin', surname: 'Gershwin', born: 1898, died: 1937, period: 'Modern', nationality: 'American', aliases: ['gershwin', 'george gershwin'] },
  { slug: 'copland', name: 'Aaron Copland', surname: 'Copland', born: 1900, died: 1990, period: 'Modern', nationality: 'American', aliases: ['copland', 'aaron copland'] },
  { slug: 'shostakovich', name: 'Dmitri Shostakovich', surname: 'Shostakovich', born: 1906, died: 1975, period: 'Modern', nationality: 'Russian', aliases: ['shostakovich', 'dmitri shostakovich'] },
]

/**
 * Windows-1252 code points that don't sit at their own byte value, needed to
 * reverse mojibake byte-for-byte (e.g. the trademark sign came from byte 0x99).
 */
const CP1252_TO_BYTE = new Map<number, number>([
  [0x20ac, 0x80], [0x201a, 0x82], [0x0192, 0x83], [0x201e, 0x84],
  [0x2026, 0x85], [0x2020, 0x86], [0x2021, 0x87], [0x02c6, 0x88],
  [0x2030, 0x89], [0x0160, 0x8a], [0x2039, 0x8b], [0x0152, 0x8c],
  [0x017d, 0x8e], [0x2018, 0x91], [0x2019, 0x92], [0x201c, 0x93],
  [0x201d, 0x94], [0x2022, 0x95], [0x2013, 0x96], [0x2014, 0x97],
  [0x02dc, 0x98], [0x2122, 0x99], [0x0161, 0x9a], [0x203a, 0x9b],
  [0x0153, 0x9c], [0x017e, 0x9e], [0x0178, 0x9f],
])

const MOJIBAKE_MARKERS = /[ÃÅÂÐ]/

/**
 * Some archive.org metadata is double-encoded: UTF-8 bytes that were read as
 * Windows-1252, so 'Dvorak' with diacritics arrives as 'DvoA...'. Reverse it so
 * composer matching and display both work. Only attempted when the telltale
 * high characters are present, and abandoned unless the bytes decode cleanly as
 * UTF-8 — which keeps correctly-encoded text untouched.
 */
export function repairMojibake(raw: string): string {
  if (!MOJIBAKE_MARKERS.test(raw)) return raw
  try {
    const bytes = new Uint8Array(raw.length)
    for (let i = 0; i < raw.length; i++) {
      const code = raw.charCodeAt(i)
      const mapped = CP1252_TO_BYTE.get(code) ?? code
      if (mapped > 0xff) return raw
      bytes[i] = mapped
    }
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    return raw
  }
}

/** Lowercase and strip diacritics so 'Antonín Dvořák' matches the alias 'dvorak'. */
function fold(raw: string): string {
  return repairMojibake(raw)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

const byAlias = new Map<string, Composer>()
for (const c of composers) {
  byAlias.set(fold(c.name), c)
  byAlias.set(fold(c.surname), c)
  for (const a of c.aliases) byAlias.set(fold(a), c)
}

const bySlug = new Map(composers.map((c) => [c.slug, c]))

/**
 * Resolve a raw name from catalog metadata to a known composer. Handles exact
 * names, surnames, accented spellings and names embedded in a longer string
 * (e.g. 'Bach , Oboe Concerto in D minor').
 */
export function findComposer(raw: string): Composer | undefined {
  const key = fold(raw)
  if (!key) return undefined
  const direct = byAlias.get(key)
  if (direct) return direct
  // Longest aliases first so 'johann strauss ii' wins over 'j. strauss'.
  const candidates = [...byAlias.entries()]
    .filter(([alias]) => alias.length > 3)
    .sort((a, b) => b[0].length - a[0].length)
  for (const [alias, composer] of candidates) {
    if (key.includes(alias)) return composer
  }
  return undefined
}

export function composerBySlug(slug: string): Composer | undefined {
  return bySlug.get(slug)
}

export function composerLifespan(c: Composer): string {
  if (!c.born) return ''
  return `${c.born}–${c.died ?? ''}`
}
