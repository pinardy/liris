import { useRef, useState } from 'react'
import { useTrackArtwork } from '../../hooks/useTrackArtwork'
import { usePlayerStore } from '../../player/playerStore'
import { formatDuration } from '../../lib/format'
import { addTrackToPlaylist, createPlaylist } from '../../services/db/playlists'
import type { Track } from '../../types/model'
import ArtworkImage from '../common/ArtworkImage'
import { CloseIcon } from '../common/icons'

function QueueRow({
  track,
  isCurrent,
  onPlay,
  onRemove,
  onDragStart,
  onDragEnter,
  onDrop,
  isDropTarget,
}: {
  track: Track
  isCurrent: boolean
  onPlay: () => void
  onRemove?: () => void
  onDragStart: () => void
  onDragEnter: () => void
  onDrop: () => void
  isDropTarget: boolean
}) {
  const artworkUrl = useTrackArtwork(track)
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      className={`group flex cursor-grab items-center gap-3 rounded-md px-2 py-1.5 hover:bg-zinc-800/70 active:cursor-grabbing ${
        isCurrent ? 'text-accent' : ''
      } ${isDropTarget ? 'border-t-2 border-accent' : 'border-t-2 border-transparent'}`}
    >
      <button
        type="button"
        onClick={onPlay}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <ArtworkImage src={artworkUrl} className="size-9" />
        <span className="min-w-0">
          <span
            className={`block truncate text-sm ${isCurrent ? 'text-accent' : 'text-white'}`}
          >
            {track.title}
          </span>
          <span className="block truncate text-xs text-zinc-400">{track.artist}</span>
        </span>
      </button>
      <span className="text-xs tabular-nums text-zinc-500">
        {formatDuration(track.durationSec)}
      </span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${track.title} from queue`}
          className="invisible text-zinc-500 hover:text-white group-hover:visible"
        >
          <CloseIcon width="16" height="16" />
        </button>
      )}
    </div>
  )
}

export default function QueuePanel({ onClose }: { onClose: () => void }) {
  const queue = usePlayerStore((s) => s.queue)
  const currentIndex = usePlayerStore((s) => s.currentIndex)
  const playFromQueue = usePlayerStore((s) => s.playFromQueue)
  const removeFromQueue = usePlayerStore((s) => s.removeFromQueue)
  const moveInQueue = usePlayerStore((s) => s.moveInQueue)
  const radioMode = usePlayerStore((s) => s.radioMode)
  const dragFrom = useRef<number | null>(null)
  const [dropTarget, setDropTarget] = useState<number | null>(null)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')

  async function saveAsPlaylist() {
    if (saveState !== 'idle' || queue.length === 0) return
    setSaveState('saving')
    try {
      const name = `Queue · ${new Date().toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })}`
      const playlist = await createPlaylist(name)
      // Sequential on purpose: keeps playlist order identical to queue order.
      for (const track of queue) await addTrackToPlaylist(playlist.id, track)
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 2500)
    } catch (err) {
      console.error('Could not save queue', err)
      setSaveState('idle')
    }
  }

  return (
    <div className="fixed inset-y-0 right-0 z-40 flex w-full max-w-sm flex-col border-l border-zinc-800 bg-zinc-950 shadow-2xl">
      <div className="flex items-center justify-between border-b border-zinc-800 p-4">
        <div>
          <h2 className="font-bold">Queue</h2>
          {radioMode && (
            <p className="text-[11px] text-accent">
              Radio — works play complete, looping
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {queue.length > 0 && (
            <button
              type="button"
              onClick={() => void saveAsPlaylist()}
              disabled={saveState !== 'idle'}
              className="rounded-full border border-zinc-700 px-3 py-1 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white disabled:opacity-70"
            >
              {saveState === 'saved'
                ? 'Saved ✓'
                : saveState === 'saving'
                  ? 'Saving…'
                  : 'Save as playlist'}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close queue"
            className="text-zinc-400 hover:text-white"
          >
            <CloseIcon />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 pb-24">
        {queue.length === 0 && (
          <p className="p-4 text-sm text-zinc-500">The queue is empty.</p>
        )}
        {queue.map((track, i) => (
          <QueueRow
            key={`${track.id}-${i}`}
            track={track}
            isCurrent={i === currentIndex}
            onPlay={() => playFromQueue(i)}
            onRemove={i !== currentIndex ? () => removeFromQueue(i) : undefined}
            onDragStart={() => {
              dragFrom.current = i
            }}
            onDragEnter={() => setDropTarget(i)}
            onDrop={() => {
              if (dragFrom.current !== null) moveInQueue(dragFrom.current, i)
              dragFrom.current = null
              setDropTarget(null)
            }}
            isDropTarget={dropTarget === i && dragFrom.current !== i}
          />
        ))}
      </div>
    </div>
  )
}
