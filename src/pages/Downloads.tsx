import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router'
import Button from '../components/common/Button'
import PageHeading from '../components/common/PageHeading'
import ArtworkImage from '../components/common/ArtworkImage'
import { EmptyState, Spinner } from '../components/common/Status'
import { CloseIcon, PlayIcon } from '../components/common/icons'
import { useTrackArtwork } from '../hooks/useTrackArtwork'
import { workIdForTrack } from '../lib/classical'
import { formatBytes, formatDuration } from '../lib/format'
import { toast } from '../lib/toast'
import { usePlayerStore } from '../player/playerStore'
import {
  getDownloads,
  removeAllDownloads,
  removeDownload,
  type DownloadEntry,
} from '../services/db/downloads'
import type { Track } from '../types/model'

function DownloadRow({
  entry,
  onPlay,
  onRemove,
}: {
  entry: DownloadEntry
  onPlay: () => void
  onRemove: () => void
}) {
  const { track, bytes } = entry
  const artworkUrl = useTrackArtwork(track)
  const workId = workIdForTrack(track)
  return (
    <div className="group flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-zinc-800/70">
      <button
        type="button"
        onClick={onPlay}
        aria-label={`Play ${track.title}`}
        className="relative shrink-0"
      >
        <ArtworkImage src={artworkUrl} className="size-10" />
        <span className="absolute inset-0 flex items-center justify-center rounded bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          <PlayIcon width="16" height="16" className="text-white" />
        </span>
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-white">{track.title}</p>
        <p className="truncate text-xs text-zinc-400">
          {workId && track.album && track.album !== track.title ? (
            <Link to={`/work/${workId}`} className="hover:text-white hover:underline">
              {track.album}
            </Link>
          ) : (
            track.album
          )}
          {track.album && track.album !== track.title && ' · '}
          {track.artist}
        </p>
      </div>
      <span className="shrink-0 text-xs tabular-nums text-zinc-500">
        {formatDuration(track.durationSec)}
      </span>
      <span className="w-16 shrink-0 text-right text-xs tabular-nums text-zinc-500">
        {formatBytes(bytes)}
      </span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove download of ${track.title}`}
        title="Remove download"
        className="invisible shrink-0 text-zinc-500 hover:text-white group-hover:visible"
      >
        <CloseIcon width="16" height="16" />
      </button>
    </div>
  )
}

export default function Downloads() {
  const data = useLiveQuery(getDownloads, [])
  const playQueue = usePlayerStore((s) => s.playQueue)

  if (data === undefined) return <Spinner />
  const { entries, orphanBytes } = data
  const totalBytes = entries.reduce((sum, e) => sum + e.bytes, 0) + orphanBytes
  const tracks: Track[] = entries.map((e) => e.track)

  async function handleRemove(entry: DownloadEntry) {
    await removeDownload(entry.track.id)
    toast(`Removed download — ${entry.track.title}`)
  }

  async function handleRemoveAll() {
    if (!confirm(`Remove all ${entries.length} downloads (${formatBytes(totalBytes)})?`))
      return
    const removed = await removeAllDownloads()
    toast(`Removed ${removed} download${removed === 1 ? '' : 's'}`)
  }

  return (
    <>
      <PageHeading title="Downloads">
        {entries.length > 0 && (
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => playQueue(tracks, 0)}>
              <PlayIcon width="14" height="14" />
              Play all
            </Button>
            <Button variant="subtle" size="sm" onClick={() => void handleRemoveAll()}>
              Remove all
            </Button>
          </div>
        )}
      </PageHeading>

      {entries.length > 0 && (
        <p className="mb-4 text-sm text-zinc-400">
          {entries.length} track{entries.length === 1 ? '' : 's'} ·{' '}
          {formatBytes(totalBytes)} stored for offline listening
          {orphanBytes > 0 && (
            <span className="text-zinc-500">
              {' '}
              (includes {formatBytes(orphanBytes)} from removed tracks — “Remove
              all” reclaims it)
            </span>
          )}
        </p>
      )}

      {entries.length > 0 ? (
        <div className="flex flex-col">
          {entries.map((entry, i) => (
            <DownloadRow
              key={entry.track.id}
              entry={entry}
              onPlay={() => playQueue(tracks, i)}
              onRemove={() => void handleRemove(entry)}
            />
          ))}
        </div>
      ) : (
        <EmptyState title="No downloads yet">
          Use the “···” menu on any track — or “Download” on a work page — to keep
          music offline. It shows up here.
        </EmptyState>
      )}
    </>
  )
}
