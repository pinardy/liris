import {
  detectCatalogue,
  detectForm,
  normalizeWorkTitle,
  slugify,
  type Recording,
  type Work,
} from '../../lib/classical'
import { findComposer, type Composer, type Period } from '../../lib/composers'
import type { Track } from '../../types/model'
import {
  archiveThumbnail,
  classicalCollections,
  fetchArchiveFiles,
  streamUrl,
  type ArchiveCollection,
} from './api'
import { parseFile } from './parse'

export interface ComposerEntry {
  composer?: Composer
  /** Falls back to the raw catalog name when the composer isn't in our table. */
  name: string
  slug: string
  works: Work[]
  trackCount: number
}

export interface PerformerEntry {
  name: string
  slug: string
  works: Work[]
}

export interface ClassicalIndex {
  works: Work[]
  composers: ComposerEntry[]
  performers: PerformerEntry[]
  byPeriod: Map<Period, Work[]>
  byForm: Map<string, Work[]>
  workById: Map<string, Work>
  trackCount: number
  /** Collections that failed to load, so the UI can be honest about gaps. */
  failedCollections: string[]
}

interface ParsedRow {
  collection: ArchiveCollection
  workId: string
  workTitle: string
  rawWorkTitle: string
  composerName: string
  composerSlug?: string
  period?: Period
  performers: string[]
  track: Track
  order: number
}

async function readCollection(collection: ArchiveCollection): Promise<ParsedRow[]> {
  const files = await fetchArchiveFiles(collection.itemId)
  const artworkUrl = archiveThumbnail(collection.itemId)
  const rows: ParsedRow[] = []

  files.forEach((file, fileIndex) => {
    const parsed = parseFile(collection.parser, file)
    if (!parsed) return

    const composer = findComposer(parsed.composerRaw)
    const composerName = composer?.name ?? parsed.composerRaw
    const workTitle = normalizeWorkTitle(parsed.workTitle)
    if (!workTitle) return

    // Slugifying both parts collapses punctuation differences, so
    // 'Goldberg Variations, BWV. 988' and '… BWV 988' resolve to one work —
    // which is how two performers' recordings come to sit side by side.
    const workId = `${composer?.slug ?? slugify(composerName)}--${slugify(workTitle)}`

    rows.push({
      collection,
      workId,
      workTitle,
      rawWorkTitle: parsed.workTitle,
      composerName,
      composerSlug: composer?.slug,
      period: composer?.period,
      performers: parsed.performers,
      order: parsed.movementNo ?? fileIndex + 1,
      track: {
        id: `arc:${collection.itemId}:${file.name}`,
        source: 'archive',
        title: parsed.movementTitle ?? workTitle,
        artist: composerName,
        album: workTitle,
        durationSec: file.durationSec,
        artworkUrl,
        archive: {
          itemId: collection.itemId,
          fileName: file.name,
          audioUrl: streamUrl(collection.itemId, file.name),
        },
        addedAt: 0,
      },
    })
  })

  return rows
}

function toWorks(rows: ParsedRow[]): Work[] {
  const grouped = new Map<string, ParsedRow[]>()
  for (const row of rows) {
    const list = grouped.get(row.workId) ?? []
    list.push(row)
    grouped.set(row.workId, list)
  }

  const works: Work[] = []
  for (const [workId, workRows] of grouped) {
    const first = workRows[0]

    // One recording per source collection — the same work performed twice
    // becomes two recordings rather than a jumble of movements.
    const byCollection = new Map<string, ParsedRow[]>()
    for (const row of workRows) {
      const list = byCollection.get(row.collection.itemId) ?? []
      list.push(row)
      byCollection.set(row.collection.itemId, list)
    }

    const recordings: Recording[] = [...byCollection.entries()].map(
      ([itemId, recRows]) => {
        const ordered = [...recRows].sort((a, b) => a.order - b.order)
        const performers: string[] = []
        for (const r of ordered) {
          for (const p of r.performers) if (!performers.includes(p)) performers.push(p)
        }
        return {
          id: `${workId}::${itemId}`,
          collectionId: itemId,
          collectionName: recRows[0].collection.name,
          license: recRows[0].collection.license,
          performers,
          tracks: ordered.map((r) => r.track),
          durationSec: ordered.reduce((sum, r) => sum + r.track.durationSec, 0),
          artworkUrl: archiveThumbnail(itemId),
        }
      },
    )
    // Richest recording first (most movements, then longest).
    recordings.sort(
      (a, b) => b.tracks.length - a.tracks.length || b.durationSec - a.durationSec,
    )

    // Prefer the longest title variant — it usually carries the key and opus.
    const title = workRows
      .map((r) => r.workTitle)
      .reduce((best, t) => (t.length > best.length ? t : best), first.workTitle)

    works.push({
      id: workId,
      title,
      composerName: first.composerName,
      composerSlug: first.composerSlug,
      period: first.period,
      catalogue:
        workRows.map((r) => detectCatalogue(r.rawWorkTitle)).find(Boolean) ?? undefined,
      formSlug: detectForm(title)?.slug,
      recordings,
    })
  }
  return works
}

function buildIndex(works: Work[], failed: string[]): ClassicalIndex {
  const composerMap = new Map<string, ComposerEntry>()
  const performerMap = new Map<string, PerformerEntry>()
  const byPeriod = new Map<Period, Work[]>()
  const byForm = new Map<string, Work[]>()
  const workById = new Map<string, Work>()
  let trackCount = 0

  // Multi-movement works first — they make better entry points than fragments.
  const sorted = [...works].sort(
    (a, b) =>
      b.recordings.length - a.recordings.length ||
      b.recordings[0].tracks.length - a.recordings[0].tracks.length ||
      a.title.localeCompare(b.title),
  )

  for (const work of sorted) {
    workById.set(work.id, work)
    trackCount += work.recordings.reduce((n, r) => n + r.tracks.length, 0)

    const slug = work.composerSlug ?? slugify(work.composerName)
    let entry = composerMap.get(slug)
    if (!entry) {
      entry = {
        composer: findComposer(work.composerName),
        name: work.composerName,
        slug,
        works: [],
        trackCount: 0,
      }
      composerMap.set(slug, entry)
    }
    entry.works.push(work)
    entry.trackCount += work.recordings.reduce((n, r) => n + r.tracks.length, 0)

    if (work.period) {
      const list = byPeriod.get(work.period) ?? []
      list.push(work)
      byPeriod.set(work.period, list)
    }
    if (work.formSlug) {
      const list = byForm.get(work.formSlug) ?? []
      list.push(work)
      byForm.set(work.formSlug, list)
    }
    for (const recording of work.recordings) {
      for (const performer of recording.performers) {
        const pslug = slugify(performer)
        let p = performerMap.get(pslug)
        if (!p) {
          p = { name: performer, slug: pslug, works: [] }
          performerMap.set(pslug, p)
        }
        if (!p.works.includes(work)) p.works.push(work)
      }
    }
  }

  return {
    works: sorted,
    composers: [...composerMap.values()].sort((a, b) => {
      const ab = a.composer?.born
      const bb = b.composer?.born
      if (ab && bb) return ab - bb
      return a.name.localeCompare(b.name)
    }),
    performers: [...performerMap.values()].sort(
      (a, b) => b.works.length - a.works.length || a.name.localeCompare(b.name),
    ),
    byPeriod,
    byForm,
    workById,
    trackCount,
    failedCollections: failed,
  }
}

let indexPromise: Promise<ClassicalIndex> | null = null

/** Bump when parsing/normalisation changes so stale shapes are discarded. */
const WORKS_CACHE_KEY = 'classical-works-v1'

async function loadCachedWorks(): Promise<Work[] | null> {
  try {
    const { db } = await import('../db/db')
    const row = await db.cache.get(WORKS_CACHE_KEY)
    const works = row?.value as Work[] | undefined
    return Array.isArray(works) && works.length > 0 ? works : null
  } catch {
    return null
  }
}

async function saveCachedWorks(works: Work[]): Promise<void> {
  try {
    const { db } = await import('../db/db')
    await db.cache.put({ key: WORKS_CACHE_KEY, value: works, savedAt: Date.now() })
  } catch {
    // Cache is an optimisation only; quota errors etc. are non-fatal.
  }
}

async function fetchWorks(): Promise<{ works: Work[]; failed: string[] }> {
  const failed: string[] = []
  const results = await Promise.all(
    classicalCollections.map((c) =>
      readCollection(c).catch((err) => {
        console.error(`Failed to load ${c.itemId}`, err)
        failed.push(c.name)
        return [] as ParsedRow[]
      }),
    ),
  )
  return { works: toWorks(results.flat()), failed }
}

/**
 * Load and index the whole classical catalog. Memoised for the session, and
 * persisted to IndexedDB: later sessions boot instantly from the stored works
 * while a background refresh updates the store for next time. (The catalog is
 * a fixed set of curated collections, so a session-stale copy is fine.)
 */
export function getClassicalIndex(): Promise<ClassicalIndex> {
  if (!indexPromise) {
    const promise = (async () => {
      const cached = await loadCachedWorks()
      if (cached) {
        void fetchWorks()
          .then(({ works }) => {
            if (works.length > 0) return saveCachedWorks(works)
          })
          .catch(() => {})
        return buildIndex(cached, [])
      }
      const { works, failed } = await fetchWorks()
      if (works.length > 0) void saveCachedWorks(works)
      const index = buildIndex(works, failed)
      // Every collection failing means we're offline with nothing cached —
      // don't memoise that, so a later visit can retry.
      if (index.works.length === 0) indexPromise = null
      return index
    })()
    indexPromise = promise
    promise.catch(() => {
      indexPromise = null
    })
  }
  return indexPromise
}
