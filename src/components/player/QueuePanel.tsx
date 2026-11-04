import { Fragment, useEffect, useRef, useState, type RefObject } from 'react'
import { useDialogBehavior } from '../../hooks/useDialogBehavior'
import { useTrackArtwork } from '../../hooks/useTrackArtwork'
import { usePlayerStore, type PersistedSession } from '../../player/playerStore'
import { formatDuration } from '../../lib/format'
import { toast } from '../../lib/toast'
import { addTrackToPlaylist, createPlaylist } from '../../services/db/playlists'
import type { Track } from '../../types/model'
import ArtworkImage from '../common/ArtworkImage'
import { CloseIcon, GripIcon } from '../common/icons'

function QueueRow({
  track,
  index,
  isCurrent,
  isPlayed,
  isDragging,
  isDropTarget,
  onPlay,
  onRemove,
  onHandlePointerDown,
  onHandlePointerMove,
  onHandlePointerEnd,
  rowRef,
}: {
  track: Track
  index: number
  isCurrent: boolean
  /** Above the playing row — already heard this session, so rendered dimmed. */
  isPlayed: boolean
  isDragging: boolean
  isDropTarget: boolean
  onPlay: () => void
  onRemove: () => void
  onHandlePointerDown: (e: React.PointerEvent) => void
  onHandlePointerMove: (e: React.PointerEvent) => void
  onHandlePointerEnd: () => void
  rowRef?: RefObject<HTMLDivElement | null>
}) {
  const artworkUrl = useTrackArtwork(track)
  return (
    <div
      ref={rowRef}
      data-queue-index={index}
      className={`group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-zinc-800/70 ${
        isDragging ? 'opacity-40' : isPlayed ? 'opacity-50 hover:opacity-100' : ''
      } ${isDropTarget ? 'border-t-2 border-accent' : 'border-t-2 border-transparent'}`}
    >
      {/* Pointer events (not HTML5 drag-and-drop) so reordering works on
          touch screens too; touch-none stops the page scrolling mid-drag.
          The handle captures the pointer, so move/up events land here for
          the whole drag no matter where the finger goes. */}
      <button
        type="button"
        onPointerDown={onHandlePointerDown}
        onPointerMove={onHandlePointerMove}
        onPointerUp={onHandlePointerEnd}
        onPointerCancel={onHandlePointerEnd}
        aria-label={`Reorder ${track.title}`}
        // Padded out to a usable drag target; negative margin keeps the
        // visual footprint of the old p-1 handle.
        className="-m-2 shrink-0 cursor-grab touch-none p-3 text-zinc-500 hover:text-zinc-300 active:cursor-grabbing"
      >
        <GripIcon width="14" height="14" />
      </button>
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
      <span className="text-xs tabular-nums text-zinc-400">
        {formatDuration(track.durationSec)}
      </span>
      {/* Always visible (and 44px) on touch, where there is no hover to
          reveal it; on desktop it appears on hover OR keyboard focus. */}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${track.title} from queue`}
        className="-my-1 flex size-11 shrink-0 items-center justify-center text-zinc-400 hover:text-white md:invisible md:size-8 md:group-hover:visible md:group-focus-within:visible"
      >
        <CloseIcon width="16" height="16" />
      </button>
    </div>
  )
}

export default function QueuePanel({ onClose }: { onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null)
  // Escape closes it, but Tab is NOT trapped: the transport underneath stays
  // deliberately reachable while the queue is open.
  useDialogBehavior(panelRef, onClose, { trap: false })
  const queue = usePlayerStore((s) => s.queue)
  const currentIndex = usePlayerStore((s) => s.currentIndex)
  const playFromQueue = usePlayerStore((s) => s.playFromQueue)
  const removeFromQueue = usePlayerStore((s) => s.removeFromQueue)
  const clearQueue = usePlayerStore((s) => s.clearQueue)
  const moveInQueue = usePlayerStore((s) => s.moveInQueue)
  const radioMode = usePlayerStore((s) => s.radioMode)
  const listRef = useRef<HTMLDivElement>(null)
  const currentRowRef = useRef<HTMLDivElement>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropTarget, setDropTarget] = useState<number | null>(null)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')

  // Long queues open with the playing track in view, not at the top.
  useEffect(() => {
    currentRowRef.current?.scrollIntoView({ block: 'center' })
  }, [])

  function jumpToCurrent() {
    currentRowRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }

  function startDrag(index: number, e: React.PointerEvent) {
    e.preventDefault()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    setDragIndex(index)
    setDropTarget(index)
  }

  // With pointer capture, move/up keep firing on the handle even though the
  // pointer wanders — elementFromPoint finds whichever row it's over.
  function onDragMove(e: React.PointerEvent) {
    if (dragIndex === null) return
    const list = listRef.current
    if (list) {
      const rect = list.getBoundingClientRect()
      if (e.clientY < rect.top + 36) list.scrollBy(0, -10)
      else if (e.clientY > rect.bottom - 36) list.scrollBy(0, 10)
    }
    const row = document
      .elementFromPoint(e.clientX, e.clientY)
      ?.closest('[data-queue-index]')
    if (row) setDropTarget(Number(row.getAttribute('data-queue-index')))
  }

  function endDrag() {
    if (dragIndex !== null && dropTarget !== null && dragIndex !== dropTarget) {
      moveInQueue(dragIndex, dropTarget)
    }
    setDragIndex(null)
    setDropTarget(null)
  }

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

  const totalSec = queue.reduce((sum, t) => sum + t.durationSec, 0)

  return (
    <>
      {/* Scrim: a stray tap closes the queue instead of starting a different
          track. The player bar and tab bar sit above it (z-40), so transport
          and navigation stay usable while the queue is open. */}
      <div
        className="fixed inset-0 z-30 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-label="Queue"
        tabIndex={-1}
        className="pt-safe pb-safe fixed inset-y-0 right-0 z-40 flex w-full max-w-sm flex-col border-l border-zinc-800 bg-zinc-950 shadow-2xl focus:outline-none"
      >
      <div className="border-b border-zinc-800 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold">Queue</h2>
            {queue.length > 0 && (
              <p className="text-[11px] text-zinc-400">
                {queue.length} track{queue.length === 1 ? '' : 's'} ·{' '}
                {formatDuration(totalSec)}
              </p>
            )}
            {radioMode && (
              <p className="text-[11px] text-accent">
                Radio — works play complete, looping
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close queue"
            className="-m-2 flex size-11 items-center justify-center text-zinc-400 hover:text-white md:size-9"
          >
            <CloseIcon />
          </button>
        </div>
        {queue.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
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
            {currentIndex >= 0 && (
              <button
                type="button"
                onClick={jumpToCurrent}
                className="rounded-full border border-zinc-700 px-3 py-1 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
              >
                Now playing
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                // Snapshot first: undo restores the queue paused exactly where
                // it was, reusing the session-restore path. That path no-ops if
                // the user has started something else meanwhile, so a late undo
                // can never clobber new playback.
                const s = usePlayerStore.getState()
                const previous: PersistedSession = {
                  queue: s.queue,
                  currentIndex: s.currentIndex,
                  originalQueue: s.originalQueue,
                  positionSec: s.positionSec,
                  shuffle: s.shuffle,
                  repeat: s.repeat,
                  radioMode: s.radioMode,
                }
                clearQueue()
                toast('Queue cleared', {
                  action: {
                    label: 'Undo',
                    onClick: () => usePlayerStore.getState().restoreSession(previous),
                  },
                })
              }}
              className="rounded-full border border-zinc-700 px-3 py-1 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
            >
              Clear
            </button>
          </div>
        )}
      </div>
      {/* Extra bottom padding on mobile: the player bar + tab bar overlay the
          panel's lower edge, and the last rows must scroll clear of them. */}
      <div ref={listRef} className="flex-1 overflow-y-auto p-2 pb-44 md:pb-24">
        {queue.length === 0 && (
          <p className="p-4 text-sm text-zinc-400">The queue is empty.</p>
        )}
        {queue.map((track, i) => (
          <Fragment key={`${track.id}-${i}`}>
            {currentIndex >= 0 && i === currentIndex + 1 && (
              <p className="mb-1 mt-3 px-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                Next up
              </p>
            )}
            <QueueRow
              track={track}
              index={i}
              isCurrent={i === currentIndex}
              isPlayed={i < currentIndex}
              isDragging={dragIndex === i}
              isDropTarget={dropTarget === i && dragIndex !== null && dragIndex !== i}
              onPlay={() => playFromQueue(i)}
              onRemove={() => removeFromQueue(i)}
              onHandlePointerDown={(e) => startDrag(i, e)}
              onHandlePointerMove={onDragMove}
              onHandlePointerEnd={endDrag}
              rowRef={i === currentIndex ? currentRowRef : undefined}
            />
          </Fragment>
        ))}
      </div>
      </div>
    </>
  )
}
