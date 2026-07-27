/**
 * Per-collection metadata parsing. Every archive.org collection we use encodes
 * composer / work / movement differently, so each gets its own reader rather
 * than one lossy generic guess.
 */

import { findComposer, repairMojibake } from '../../lib/composers'

export type ParserKind = 'musopen' | 'chopin' | 'goldberg' | 'masterpieces'

export interface ParsedFields {
  composerRaw: string
  workTitle: string
  movementNo?: number
  movementTitle?: string
  performers: string[]
}

export interface RawFile {
  name: string
  title?: string
  creator?: string
  album?: string
}

function clean(s: string): string {
  return repairMojibake(s).replace(/\s+/g, ' ').trim()
}

function baseName(path: string): string {
  return (path.split('/').pop() ?? path).replace(/\.[^.]+$/, '')
}

function performersFrom(creator?: string): string[] {
  if (!creator) return []
  // Archive.org separates multiple credits with ';'
  return creator
    .split(';')
    .map((s) => clean(s))
    .filter(Boolean)
}

/** 'Composer - [NN -] Work [- Movement]' — the number's position varies. */
function parseMusopen(file: RawFile): ParsedFields | null {
  const source = file.title?.trim() || baseName(file.name)
  const segs = source
    .split(' - ')
    .map((s) => clean(s))
    .filter(Boolean)
  if (segs.length < 2) return null

  const composerRaw = segs[0]
  const rest = segs.slice(1)
  let movementNo: number | undefined
  const numIdx = rest.findIndex((s) => /^\d{1,3}$/.test(s))
  if (numIdx >= 0) {
    movementNo = Number(rest[numIdx])
    rest.splice(numIdx, 1)
  }
  if (rest.length === 0) return null

  return {
    composerRaw,
    workTitle: rest[0],
    movementNo,
    movementTitle: rest.length > 1 ? rest.slice(1).join(' - ') : undefined,
    performers: performersFrom(file.creator),
  }
}

/** Whole collection is Chopin; titles are usually only in the filename. */
function parseChopin(file: RawFile): ParsedFields | null {
  const source = file.title?.trim() || baseName(file.name)
  // 'Ballade no. 3 - Op. 47' reads better as 'Ballade no. 3, Op. 47'
  const workTitle = clean(source.replace(/\s+-\s+(Op\.)/i, ', $1'))
  if (!workTitle) return null
  return { composerRaw: 'Chopin', workTitle, performers: [] }
}

/** One work; each file is a movement, with the performer on the item. */
function parseGoldberg(file: RawFile): ParsedFields | null {
  const movementTitle = file.title?.trim() || baseName(file.name)
  const numMatch = /(?:^|[^\d])(\d{1,2})\s+[^/]*$/.exec(baseName(file.name))
  return {
    composerRaw: 'Bach',
    workTitle: 'Goldberg Variations, BWV 988',
    movementNo: numMatch ? Number(numMatch[1]) : undefined,
    movementTitle,
    performers: performersFrom(file.creator),
  }
}

/**
 * Mixed conventions: titles are sometimes 'YEAR Composer / Work' but usually
 * just the work, while filenames use 'YEAR Composer , Work', 'YEAR Composer-
 * Work' or occasionally omit the composer entirely. So: take the work from the
 * (clean) title field, and find the composer by scanning the filename against
 * the known-composer table, with a curated fallback for the unattributed few.
 */
const UNATTRIBUTED: Record<string, string> = {
  'serenata notturna': 'Mozart',
  'flute concerto no. 2 in d': 'Mozart',
  'rondo alla turca, from piano sonata in a': 'Mozart',
  'horn concerto no. 3 in e flat': 'Mozart',
  'piano concerto no. 21 in c': 'Mozart',
  'piano concerto no. 23 in a': 'Mozart',
  'the marriage of figaro': 'Mozart',
  'don giovanni': 'Mozart',
  'eine kleine nachtmusik': 'Mozart',
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function parseMasterpieces(file: RawFile): ParsedFields | null {
  const fileBase = baseName(file.name).replace(/^\d{4}\s+/, '')
  const found = findComposer(fileBase)

  let workTitle = clean(
    (file.title?.trim() || fileBase).replace(/^\d{4}\s+/, '').replace(/^[^/]+\/\s*/, ''),
  )
  if (!workTitle) return null

  // Titles here often repeat the composer ('Schubert - German Dance No.1',
  // 'Beethoven: Fur Elise'). Strip it, or the composer's name would be read as
  // the work and the actual work as a movement.
  if (found) {
    const names = [found.name, ...found.aliases, found.surname].sort(
      (a, b) => b.length - a.length,
    )
    for (const n of names) {
      const re = new RegExp(`^${escapeRegex(n)}\\s*[:,\\-–]\\s*`, 'i')
      if (re.test(workTitle)) {
        workTitle = clean(workTitle.replace(re, ''))
        break
      }
    }
  }
  if (!workTitle) return null

  let movementTitle: string | undefined
  const mv =
    /^(.*?),\s*((?:[IVX]+\.\s*)?(?:\d+(?:st|nd|rd|th)\s+)?mov(?:ement|t)?\.?.*)$/i.exec(
      workTitle,
    ) ??
    /^(.*?),\s*([IVX]+\.\s+.+)$/.exec(workTitle) ??
    /^(.*?)\s+-\s+(.+)$/.exec(workTitle)
  if (mv && clean(mv[1])) {
    workTitle = clean(mv[1])
    movementTitle = clean(mv[2])
  }

  const composerRaw =
    found?.name ??
    UNATTRIBUTED[workTitle.toLowerCase()] ??
    UNATTRIBUTED[clean(workTitle.toLowerCase().replace(/\s*\(.*\)$/, ''))] ??
    ''
  if (!composerRaw) return null

  return { composerRaw, workTitle, movementTitle, performers: [] }
}

const parsers: Record<ParserKind, (f: RawFile) => ParsedFields | null> = {
  musopen: parseMusopen,
  chopin: parseChopin,
  goldberg: parseGoldberg,
  masterpieces: parseMasterpieces,
}

export function parseFile(kind: ParserKind, file: RawFile): ParsedFields | null {
  return parsers[kind](file)
}
