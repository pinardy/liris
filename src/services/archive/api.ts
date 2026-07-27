import type { Track } from '../../types/model'

/**
 * Internet Archive (archive.org) as a source of public-domain classical
 * recordings. We use a curated allowlist of well-known open items rather than
 * open-ended search: search results on IA are noisy (audiobooks, mislabeled
 * uploads), while these items are verified public-domain / CC recordings with
 * individually streamable VBR MP3 files.
 *
 * APIs used (both CORS-enabled):
 * - metadata: https://archive.org/metadata/<itemId>
 * - thumbnails: https://archive.org/services/img/<itemId>
 * Audio streams from https://archive.org/download/<itemId>/<file> with
 * Range-request support, so seeking works.
 */

export interface ArchiveCollection {
  itemId: string
  name: string
  artist: string
  description: string
  /** Classical subcategory slugs (see lib/classical.ts) this collection belongs to. */
  categories: string[]
}

export const classicalCollections: ArchiveCollection[] = [
  {
    itemId: 'MusopenCollectionAsFlac',
    name: 'Musopen Collection',
    artist: 'Bach · Beethoven · Brahms · Schubert…',
    description:
      'The Musopen Kickstarter project: professional public-domain recordings of major works by Bach, Beethoven, Brahms, Schubert and more.',
    categories: ['piano', 'violin', 'orchestra', 'symphony', 'chamber'],
  },
  {
    itemId: 'musopen-chopin',
    name: 'The Complete Chopin Collection',
    artist: 'Frédéric Chopin',
    description:
      'Musopen’s complete recordings of Chopin — nocturnes, preludes, études, waltzes and concertos, all public domain.',
    categories: ['piano'],
  },
  {
    itemId: 'OpenGoldbergVariations',
    name: 'Open Goldberg Variations',
    artist: 'J.S. Bach — Kimiko Ishizaka',
    description:
      'Kimiko Ishizaka’s acclaimed CC0 studio recording of Bach’s Goldberg Variations, BWV 988.',
    categories: ['piano'],
  },
  {
    itemId: '100ClassicalMusicMasterpieces',
    name: '100 Classical Music Masterpieces',
    artist: 'Various composers',
    description:
      'A chronological tour through 100 famous classical pieces, from Purcell to the 20th century.',
    categories: ['orchestra', 'symphony', 'opera'],
  },
]

export function archiveThumbnail(itemId: string): string {
  return `https://archive.org/services/img/${itemId}`
}

interface ArchiveFile {
  name: string
  format: string
  title?: string
  creator?: string
  length?: string
  track?: string
}

interface ArchiveMetadataResponse {
  metadata?: { title?: string; creator?: string | string[] }
  files?: ArchiveFile[]
}

/** IA lengths are either "hh:mm:ss" / "mm:ss" or plain seconds ("177.06"). */
function parseLength(raw?: string): number {
  if (!raw) return 0
  if (raw.includes(':')) {
    return raw
      .split(':')
      .reduce((total, part) => total * 60 + (Number.parseFloat(part) || 0), 0)
  }
  return Number.parseFloat(raw) || 0
}

/** "Bach_GoldbergVariations/JohannSebastianBach-01-Aria.mp3" → "JohannSebastianBach-01-Aria" */
function titleFromFileName(name: string): string {
  const base = name.split('/').pop() ?? name
  return base.replace(/\.[^.]+$/, '')
}

function streamUrl(itemId: string, fileName: string): string {
  const encodedPath = fileName.split('/').map(encodeURIComponent).join('/')
  return `https://archive.org/download/${itemId}/${encodedPath}`
}

export async function getArchiveCollectionTracks(
  itemId: string,
): Promise<{ collection: ArchiveCollection; tracks: Track[] } | null> {
  const collection = classicalCollections.find((c) => c.itemId === itemId)
  if (!collection) return null

  const res = await fetch(`https://archive.org/metadata/${itemId}`)
  if (!res.ok) throw new Error(`archive.org request failed (HTTP ${res.status})`)
  const body = (await res.json()) as ArchiveMetadataResponse

  const tracks = (body.files ?? [])
    .filter((f) => f.format === 'VBR MP3')
    // File names embed work + track order, so a name sort groups movements correctly.
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(
      (f): Track => ({
        id: `arc:${itemId}:${f.name}`,
        source: 'archive',
        title: f.title?.trim() || titleFromFileName(f.name),
        artist: f.creator?.trim() || collection.artist,
        album: collection.name,
        durationSec: parseLength(f.length),
        artworkUrl: archiveThumbnail(itemId),
        archive: {
          itemId,
          fileName: f.name,
          audioUrl: streamUrl(itemId, f.name),
        },
        addedAt: 0,
      }),
    )

  return { collection, tracks }
}
