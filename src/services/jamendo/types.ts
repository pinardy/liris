/** Raw Jamendo API v3.0 response shapes. These must never leak past services/jamendo. */

export interface JamendoEnvelope<T> {
  headers: {
    status: 'success' | 'failed'
    code: number
    error_message?: string
    results_count: number
  }
  results: T[]
}

export interface JamendoTrack {
  id: string
  name: string
  duration: number
  artist_id: string
  artist_name: string
  album_id: string
  album_name: string
  album_image: string
  image: string
  /** Direct MP3 stream URL — use as-is, no auth needed. */
  audio: string
  releasedate?: string
}

export interface JamendoAlbum {
  id: string
  name: string
  artist_id: string
  artist_name: string
  image: string
  releasedate?: string
}

export interface JamendoAlbumTrack {
  id: string
  name: string
  duration: number
  audio: string
  position: number
}

export interface JamendoAlbumWithTracks extends JamendoAlbum {
  tracks: JamendoAlbumTrack[]
}

export interface JamendoArtist {
  id: string
  name: string
  image: string
}

export interface JamendoArtistTrack {
  id: string
  name: string
  duration: number
  audio: string
  album_id: string | null
  album_name: string | null
  album_image: string | null
  image?: string
  releasedate?: string
}

export interface JamendoArtistWithTracks extends JamendoArtist {
  tracks: JamendoArtistTrack[]
}

export interface JamendoRadio {
  id: number
  name: string
  dispname: string
  image: string
}

export interface JamendoRadioStream extends JamendoRadio {
  /** Icecast MP3 stream URL. */
  stream: string
  playingnow?: { track_name?: string; artist_name?: string }
}
