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
