import { useEffect, useState } from 'react'
import type { Track } from '../types/model'

/**
 * Resolve a track's artwork for display: remote URL for Jamendo, or an
 * object URL for local blob artwork (revoked on cleanup).
 */
export function useTrackArtwork(track?: Track): string | undefined {
  const remote = track?.artworkUrl
  const artworkKey = track?.local?.artworkKey
  const [blobUrl, setBlobUrl] = useState<string>()

  useEffect(() => {
    if (remote || !artworkKey) {
      setBlobUrl(undefined)
      return
    }
    let url: string | undefined
    let cancelled = false
    void import('../services/db/library').then(async ({ getArtworkBlob }) => {
      const blob = await getArtworkBlob(artworkKey)
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
