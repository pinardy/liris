export type TrackSource = 'jamendo' | 'local' | 'archive'

export interface JamendoTrackInfo {
  trackId: string
  audioUrl: string
  albumId?: string
  artistId?: string
}

export interface LocalTrackInfo {
  fileKey: string
  artworkKey?: string
  mimeType: string
  fileName: string
}

/** A file inside an Internet Archive item (public domain recordings). */
export interface ArchiveTrackInfo {
  itemId: string
  fileName: string
  audioUrl: string
}

/**
 * Unified track abstraction. Everything downstream (queue, playlists,
 * favorites, player) deals only in Track; only the Jamendo mappers and
 * resolveSource know source-specific details.
 */
export interface Track {
  /** 'jam:<jamendo_id>' | 'loc:<uuid>' */
  id: string
  source: TrackSource
  title: string
  artist: string
  album?: string
  durationSec: number
  /** Remote artwork URL (Jamendo). Local artwork lives as a blob in the artwork table. */
  artworkUrl?: string
  jamendo?: JamendoTrackInfo
  local?: LocalTrackInfo
  archive?: ArchiveTrackInfo
  addedAt: number
}

export interface Playlist {
  id: string
  name: string
  trackIds: string[]
  createdAt: number
  updatedAt: number
}

/**
 * Rules for a smart playlist, matched against the classical catalog index.
 * Empty/absent fields mean "any"; set fields must all match (AND), while
 * values within one field are alternatives (OR).
 */
export interface SmartRules {
  /** Period names, e.g. 'Baroque'. */
  periods?: string[]
  formSlugs?: string[]
  composerSlugs?: string[]
  instruments?: string[]
  /** Only works whose preferred recording fits within this many minutes. */
  maxWorkMinutes?: number
}

/** A rule-based playlist: evaluated against the live catalog, never stored
 *  as a track list, so it stays current as the catalog evolves. */
export interface SmartPlaylist {
  id: string
  name: string
  rules: SmartRules
  createdAt: number
  updatedAt: number
}
