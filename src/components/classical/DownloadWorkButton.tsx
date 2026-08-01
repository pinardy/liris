import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import type { Track } from '../../types/model'
import {
  downloadTrack,
  getDownloadedIds,
  isDownloadable,
  isQuotaError,
  removeDownload,
} from '../../services/db/downloads'
import { toast } from '../../lib/toast'
import { buttonClass } from '../common/buttonStyles'

/**
 * Downloads every movement of a recording for offline listening, with
 * progress; once complete, the same button removes the downloads. Individual
 * failures don't abort the rest.
 */
export default function DownloadWorkButton({ tracks }: { tracks: Track[] }) {
  const downloadedIds = useLiveQuery(getDownloadedIds, [])
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [failures, setFailures] = useState(0)

  const downloadable = tracks.filter(isDownloadable)
  if (downloadable.length === 0) return null

  const missing = downloadedIds
    ? downloadable.filter((t) => !downloadedIds.has(t.id))
    : downloadable
  const complete = downloadedIds !== undefined && missing.length === 0

  async function handleClick() {
    if (progress) return
    if (complete) {
      for (const t of downloadable) await removeDownload(t.id)
      return
    }
    setFailures(0)
    let failed = 0
    for (let i = 0; i < missing.length; i++) {
      setProgress({ done: i, total: missing.length })
      try {
        await downloadTrack(missing[i])
      } catch (err) {
        console.error('Movement download failed', err)
        failed++
        // Storage full: the remaining movements can only fail the same way.
        if (isQuotaError(err)) {
          toast('Storage is full — remove downloads in Your Library first')
          failed += missing.length - 1 - i
          break
        }
      }
    }
    setFailures(failed)
    setProgress(null)
  }

  const label = progress
    ? `Downloading ${progress.done + 1}/${progress.total}…`
    : complete
      ? 'Downloaded ✓'
      : failures > 0
        ? `Retry (${failures} failed)`
        : 'Download'

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={Boolean(progress)}
      title={
        complete
          ? 'All movements are stored offline — click to remove the downloads'
          : 'Store every movement of this recording for offline listening'
      }
      className={buttonClass('outline')}
    >
      {label}
    </button>
  )
}
