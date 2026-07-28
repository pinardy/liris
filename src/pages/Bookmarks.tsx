import { useLiveQuery } from 'dexie-react-hooks'
import PageHeading from '../components/common/PageHeading'
import { EmptyState, Spinner } from '../components/common/Status'
import { CloseIcon, PlayIcon } from '../components/common/icons'
import { formatDuration } from '../lib/format'
import { usePlayerStore } from '../player/playerStore'
import {
  getBookmarks,
  removeBookmark,
  type BookmarkEntry,
} from '../services/db/bookmarks'

function BookmarkRow({ entry }: { entry: BookmarkEntry }) {
  const playTrackFrom = usePlayerStore((s) => s.playTrackFrom)
  const { bookmark, track } = entry
  return (
    <div className="group flex items-center gap-3 rounded-md px-2 py-2 hover:bg-zinc-800/70">
      <button
        type="button"
        onClick={() => track && playTrackFrom(track, bookmark.positionSec)}
        disabled={!track}
        aria-label={`Resume ${bookmark.title} at ${formatDuration(bookmark.positionSec)}`}
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-zinc-300 transition-colors enabled:group-hover:bg-accent enabled:group-hover:text-black disabled:opacity-40"
      >
        <PlayIcon width="14" height="14" className="translate-x-px" />
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">
          {bookmark.title}
          <span className="ml-2 font-normal text-accent">
            at {formatDuration(bookmark.positionSec)}
          </span>
        </p>
        <p className="truncate text-xs text-zinc-400">
          {bookmark.work && bookmark.work !== bookmark.title && `${bookmark.work} · `}
          {bookmark.composer}
          {' · saved '}
          {new Date(bookmark.createdAt).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          })}
        </p>
      </div>
      {track && (
        <span className="shrink-0 text-xs tabular-nums text-zinc-500">
          / {formatDuration(track.durationSec)}
        </span>
      )}
      <button
        type="button"
        onClick={() => void removeBookmark(bookmark.id)}
        aria-label={`Delete bookmark in ${bookmark.title}`}
        className="invisible shrink-0 text-zinc-500 hover:text-white group-hover:visible"
      >
        <CloseIcon width="16" height="16" />
      </button>
    </div>
  )
}

export default function Bookmarks() {
  const entries = useLiveQuery(getBookmarks, [])

  if (entries === undefined) return <Spinner />

  return (
    <>
      <PageHeading title="Bookmarks" />
      {entries.length > 0 ? (
        <div className="flex max-w-3xl flex-col">
          {entries.map((entry) => (
            <BookmarkRow key={entry.bookmark.id} entry={entry} />
          ))}
        </div>
      ) : (
        <EmptyState title="No bookmarks yet">
          While something plays, tap the bookmark icon in the player to save your spot
          in a long movement — resume it from here anytime.
        </EmptyState>
      )}
    </>
  )
}
