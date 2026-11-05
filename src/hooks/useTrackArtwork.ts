import { useEffect, useState } from 'react'
import { getArtworkBlob } from '../services/db/library'
import type { Track } from '../types/model'
import { trackArtworkUrl } from '../lib/classical'

/**
 * Resolve a track's artwork for display: the composer's portrait for catalog
 * recordings, the remote URL for Jamendo, or an object URL for local blob
 * artwork (revoked on cleanup).
 */
export function useTrackArtwork(track?: Track): string | undefined {
  const remote = track ? trackArtworkUrl(track) : undefined
  const artworkKey = track?.local?.artworkKey
  const [blobUrl, setBlobUrl] = useState<string>()

  useEffect(() => {
    if (remote || !artworkKey) {
      setBlobUrl(undefined)
      return
    }
    let url: string | undefined
    let cancelled = false
    void getArtworkBlob(artworkKey).then((blob) => {
      if (blob && !cancelled) {
        url = URL.createObjectURL(blob)
        setBlobUrl(url)
      }
    })
    return () => {
      cancelled = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [remote, artworkKey])

  return remote ?? blobUrl
}
