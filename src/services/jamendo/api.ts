import type { Track } from '../../types/model'
import { jam } from './client'
import { mapTrack } from './mappers'
import type { JamendoRadio, JamendoRadioStream, JamendoTrack } from './types'

const AUDIO_FORMAT = 'mp32'

/**
 * Jamendo supplies the app's *contemporary* strand — living independent
 * composers — plus its live radio streams. The public-domain classical
 * repertoire comes from archive.org instead (see services/archive).
 */

/** Tracks matching ALL given tags (Jamendo's `tags` param, space-separated = AND). */
export async function getTracksByTags(tags: string[], limit = 50): Promise<Track[]> {
  const results = await jam<JamendoTrack>('/tracks/', {
    tags: tags.join(' '),
    // popularity_total, not popularity_week: the weekly window combined with a
    // tag filter returns zero results for several tags.
    order: 'popularity_total',
    limit,
    audioformat: AUDIO_FORMAT,
  })
  return results.map(mapTrack)
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
