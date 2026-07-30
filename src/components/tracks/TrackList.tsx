import { useRef, useState, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { getDownloadedIds } from '../../services/db/downloads'
import { getFavoriteIds } from '../../services/db/favorites'
import type { Track } from '../../types/model'
import { GripIcon } from '../common/icons'
import { DownloadedIdsContext, FavoriteIdsContext } from './favoritesContext'
import TrackActions from './TrackActions'
import TrackRow from './TrackRow'

interface Props {
  tracks: Track[]
  /** Called with the clicked index; typically starts playback of the whole list as a queue. */
  onPlay: (index: number) => void
  /** Defaults to the standard favorite + overflow-menu actions. */
  renderActions?: (track: Track) => ReactNode
  /** When set, rows get a drag handle; called with (from, to) on drop. */
  onReorder?: (from: number, to: number) => void
}

const defaultActions = (track: Track) => <TrackActions track={track} />

export default function TrackList({
  tracks,
  onPlay,
  renderActions = defaultActions,
  onReorder,
}: Props) {
  const favoriteIds = useLiveQuery(getFavoriteIds, [])
  const downloadedIds = useLiveQuery(getDownloadedIds, [])

  // Same pointer-event drag as the queue panel, so it works on touch.
  const listRef = useRef<HTMLDivElement>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropTarget, setDropTarget] = useState<number | null>(null)

  function startDrag(index: number, e: React.PointerEvent) {
    e.preventDefault()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    setDragIndex(index)
    setDropTarget(index)
  }

  function onDragMove(e: React.PointerEvent) {
    if (dragIndex === null) return
    const row = document
      .elementFromPoint(e.clientX, e.clientY)
      ?.closest('[data-list-index]')
    if (row && listRef.current?.contains(row)) {
      setDropTarget(Number(row.getAttribute('data-list-index')))
    }
  }

  function endDrag() {
    if (dragIndex !== null && dropTarget !== null && dragIndex !== dropTarget) {
      onReorder?.(dragIndex, dropTarget)
    }
    setDragIndex(null)
    setDropTarget(null)
  }

  return (
    <FavoriteIdsContext.Provider value={favoriteIds}>
      <DownloadedIdsContext.Provider value={downloadedIds}>
        <div ref={listRef} className="flex flex-col">
          {tracks.map((track, i) => {
            const row = (
              <TrackRow
                key={onReorder ? undefined : track.id}
                track={track}
                index={i}
                onPlay={() => onPlay(i)}
                actions={renderActions?.(track)}
              />
            )
            if (!onReorder) return row
            return (
              <div
                key={`${track.id}-${i}`}
                data-list-index={i}
                className={`flex items-center ${dragIndex === i ? 'opacity-40' : ''} ${
                  dropTarget === i && dragIndex !== null && dragIndex !== i
                    ? 'border-t-2 border-accent'
                    : 'border-t-2 border-transparent'
                }`}
              >
                <button
                  type="button"
                  onPointerDown={(e) => startDrag(i, e)}
                  onPointerMove={onDragMove}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                  aria-label={`Reorder ${track.title}`}
                  className="shrink-0 cursor-grab touch-none p-1 text-zinc-600 hover:text-zinc-300 active:cursor-grabbing"
                >
                  <GripIcon width="14" height="14" />
                </button>
                <div className="min-w-0 flex-1">{row}</div>
              </div>
            )
          })}
        </div>
      </DownloadedIdsContext.Provider>
    </FavoriteIdsContext.Provider>
  )
}
