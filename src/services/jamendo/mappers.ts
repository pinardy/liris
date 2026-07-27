import type { Track } from '../../types/model'
import type { JamendoTrack } from './types'

export function mapTrack(t: JamendoTrack): Track {
  return {
    id: `jam:${t.id}`,
    source: 'jamendo',
    title: t.name,
    artist: t.artist_name,
    album: t.album_name || undefined,
    durationSec: t.duration,
    artworkUrl: t.album_image || t.image || undefined,
    jamendo: {
      trackId: t.id,
      audioUrl: t.audio,
      albumId: t.album_id || undefined,
      artistId: t.artist_id || undefined,
    },
    addedAt: 0,
  }
}
