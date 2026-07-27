import type { Track } from '../../types/model'
import type { ParserKind } from './parse'

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
  /** How to read composer/work/movement out of this item's file metadata. */
  parser: ParserKind
  /** Rights statement shown in the UI; every item must be verifiably free. */
  license: string
}

export const classicalCollections: ArchiveCollection[] = [
  {
    itemId: 'MusopenCollectionAsFlac',
    name: 'Musopen Collection',
    artist: 'Czech National Symphony Orchestra & others',
    description:
      'The Musopen Kickstarter project: professional recordings of major works by Bach, Beethoven, Brahms, Borodin, Dvořák and more, released into the public domain.',
    parser: 'musopen',
    license: 'Public Domain Mark 1.0',
  },
  {
    itemId: 'musopen-chopin',
    name: 'The Complete Chopin Collection',
    artist: 'Frédéric Chopin',
    description:
      'Musopen’s complete Chopin recordings — nocturnes, preludes, études, waltzes, ballades and concertos.',
    parser: 'chopin',
    license: 'CC0 1.0',
  },
  {
    itemId: 'OpenGoldbergVariations',
    name: 'Open Goldberg Variations',
    artist: 'Kimiko Ishizaka',
    description:
      'Kimiko Ishizaka’s acclaimed studio recording of Bach’s Goldberg Variations, BWV 988, dedicated to the public domain.',
    parser: 'goldberg',
    license: 'CC0 1.0',
  },
  {
    itemId: '100ClassicalMusicMasterpieces',
    name: '100 Classical Music Masterpieces',
    artist: 'Various performers',
    description:
      'A chronological tour through 100 famous pieces, from Purcell to the twentieth century.',
    parser: 'masterpieces',
    // NOTE: this item carries no explicit licence on archive.org. The
    // compositions are long out of copyright, but the recordings' status is
    // unverified — see README.
    license: 'Unverified',
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
  album?: string
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

export function streamUrl(itemId: string, fileName: string): string {
  const encodedPath = fileName.split('/').map(encodeURIComponent).join('/')
  return `https://archive.org/download/${itemId}/${encodedPath}`
}

export interface ArchiveAudioFile {
  name: string
  title?: string
  creator?: string
  album?: string
  durationSec: number
}

/**
 * Streamable audio files for an item, sorted by name — filenames embed work and
 * movement order, so a name sort keeps movements sequential.
 */
export async function fetchArchiveFiles(itemId: string): Promise<ArchiveAudioFile[]> {
  const res = await fetch(`https://archive.org/metadata/${itemId}`)
  if (!res.ok) throw new Error(`archive.org request failed (HTTP ${res.status})`)
  const body = (await res.json()) as ArchiveMetadataResponse
  return (body.files ?? [])
    .filter((f) => f.format === 'VBR MP3')
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((f) => ({
      name: f.name,
      title: f.title,
      creator: f.creator,
      album: f.album,
      durationSec: parseLength(f.length),
    }))
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
