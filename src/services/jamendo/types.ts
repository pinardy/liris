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
