import type { Album, Artist, Track } from '../../types/model'
import { jam } from './client'
import {
  mapAlbum,
  mapAlbumTracks,
  mapArtist,
  mapArtistTracks,
  mapTrack,
} from './mappers'
import type {
  JamendoAlbum,
  JamendoAlbumWithTracks,
  JamendoArtist,
  JamendoArtistWithTracks,
  JamendoRadio,
  JamendoRadioStream,
  JamendoTrack,
} from './types'

const AUDIO_FORMAT = 'mp32'

export async function getTrendingTracks(limit = 20): Promise<Track[]> {
  const results = await jam<JamendoTrack>('/tracks/', {
    order: 'popularity_week',
    limit,
    audioformat: AUDIO_FORMAT,
  })
  return results.map(mapTrack)
}

export async function getTracksByGenre(tag: string, limit = 50): Promise<Track[]> {
  // popularity_total, not popularity_week: the weekly window combined with a
  // tag filter returns zero results for several genres.
  const results = await jam<JamendoTrack>('/tracks/', {
    fuzzytags: tag,
    order: 'popularity_total',
    limit,
    audioformat: AUDIO_FORMAT,
  })
  return results.map(mapTrack)
}

/** Tracks matching ALL given tags (Jamendo's `tags` param, space-separated = AND). */
export async function getTracksByTags(tags: string[], limit = 50): Promise<Track[]> {
  const results = await jam<JamendoTrack>('/tracks/', {
    tags: tags.join(' '),
    order: 'popularity_total',
    limit,
    audioformat: AUDIO_FORMAT,
  })
  return results.map(mapTrack)
}

export async function searchTracks(query: string, limit = 25): Promise<Track[]> {
  const results = await jam<JamendoTrack>('/tracks/', {
    search: query,
    limit,
    audioformat: AUDIO_FORMAT,
  })
  return results.map(mapTrack)
}

export async function getPopularAlbums(limit = 12): Promise<Album[]> {
  const results = await jam<JamendoAlbum>('/albums/', {
    order: 'popularity_week',
    limit,
  })
  return results.map(mapAlbum)
}

export async function searchAlbums(query: string, limit = 24): Promise<Album[]> {
  const results = await jam<JamendoAlbum>('/albums/', { search: query, limit })
  return results.map(mapAlbum)
}

export async function searchArtists(query: string, limit = 24): Promise<Artist[]> {
  const results = await jam<JamendoArtist>('/artists/', { search: query, limit })
  return results.map(mapArtist)
}

export interface RadioStation {
  name: string
  dispName: string
  imageUrl?: string
}

export async function getRadios(limit = 20): Promise<RadioStation[]> {
  const results = await jam<JamendoRadio>('/radios/', { limit })
  return results.map((r) => ({
    name: r.name,
    dispName: r.dispname,
    imageUrl: r.image || undefined,
  }))
}

/** Build a playable pseudo-Track for a live radio station. */
export async function getRadioTrack(station: RadioStation): Promise<Track> {
  const results = await jam<JamendoRadioStream>('/radios/stream/', {
    name: station.name,
  })
  const stream = results[0]?.stream
  if (!stream) throw new Error('Radio stream unavailable')
  return {
    id: `radio:${station.name}`,
    source: 'jamendo',
    title: station.dispName,
    artist: 'Jamendo Radio · live',
    durationSec: 0,
    artworkUrl: station.imageUrl,
    jamendo: { trackId: `radio-${station.name}`, audioUrl: stream },
    addedAt: 0,
  }
}

export async function getAlbumWithTracks(
  albumId: string,
): Promise<{ album: Album; tracks: Track[] } | null> {
  const results = await jam<JamendoAlbumWithTracks>('/albums/tracks/', {
    id: albumId,
    audioformat: AUDIO_FORMAT,
  })
  const raw = results[0]
  if (!raw) return null
  return { album: mapAlbum(raw), tracks: mapAlbumTracks(raw) }
}

export async function getArtistWithTracks(
  artistId: string,
): Promise<{ artist: Artist; tracks: Track[] } | null> {
  const results = await jam<JamendoArtistWithTracks>('/artists/tracks/', {
    id: artistId,
    audioformat: AUDIO_FORMAT,
  })
  const raw = results[0]
  if (!raw) return null
  return { artist: mapArtist(raw), tracks: mapArtistTracks(raw) }
}
