import type { Album, Artist, Track } from '../../types/model'
import type {
  JamendoAlbum,
  JamendoAlbumWithTracks,
  JamendoArtist,
  JamendoArtistWithTracks,
  JamendoTrack,
} from './types'

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

export function mapAlbum(a: JamendoAlbum): Album {
  return {
    id: a.id,
    name: a.name,
    artist: a.artist_name,
    artistId: a.artist_id || undefined,
    artworkUrl: a.image || undefined,
    releaseDate: a.releasedate,
  }
}

export function mapArtist(a: JamendoArtist): Artist {
  return {
    id: a.id,
    name: a.name,
    imageUrl: a.image || undefined,
  }
}

export function mapAlbumTracks(album: JamendoAlbumWithTracks): Track[] {
  return [...album.tracks]
    .sort((a, b) => a.position - b.position)
    .map((t) => ({
      id: `jam:${t.id}`,
      source: 'jamendo' as const,
      title: t.name,
      artist: album.artist_name,
      album: album.name,
      durationSec: t.duration,
      artworkUrl: album.image || undefined,
      jamendo: {
        trackId: t.id,
        audioUrl: t.audio,
        albumId: album.id,
        artistId: album.artist_id || undefined,
      },
      addedAt: 0,
    }))
}

export function mapArtistTracks(artist: JamendoArtistWithTracks): Track[] {
  return artist.tracks.map((t) => ({
    id: `jam:${t.id}`,
    source: 'jamendo' as const,
    title: t.name,
    artist: artist.name,
    album: t.album_name || undefined,
    durationSec: t.duration,
    artworkUrl: t.album_image || t.image || undefined,
    jamendo: {
      trackId: t.id,
      audioUrl: t.audio,
      albumId: t.album_id || undefined,
      artistId: artist.id,
    },
    addedAt: 0,
  }))
}
