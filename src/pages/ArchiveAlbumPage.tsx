import { useParams } from 'react-router'
import ArtworkImage from '../components/common/ArtworkImage'
import { PlayIcon } from '../components/common/icons'
import { EmptyState, ErrorMessage, Spinner } from '../components/common/Status'
import TrackList from '../components/tracks/TrackList'
import { useAsync } from '../hooks/useAsync'
import { formatDuration } from '../lib/format'
import { usePlayerStore } from '../player/playerStore'
import { archiveThumbnail, getArchiveCollectionTracks } from '../services/archive/api'

/** A public-domain collection from the Internet Archive, rendered like an album. */
export default function ArchiveAlbumPage() {
  const { itemId } = useParams()
  const state = useAsync(
    () => getArchiveCollectionTracks(itemId!),
    [itemId],
    Boolean(itemId),
    `archive:${itemId}`,
  )
  const playQueue = usePlayerStore((s) => s.playQueue)

  if (state.loading) return <Spinner />
  if (state.error) return <ErrorMessage error={state.error} />
  if (!state.data) return <EmptyState title="Collection not found" />

  const { collection, tracks } = state.data
  const totalSec = tracks.reduce((sum, t) => sum + t.durationSec, 0)

  return (
    <>
      <div className="mb-8 flex flex-col items-start gap-5 sm:flex-row sm:items-end">
        <ArtworkImage
          src={archiveThumbnail(collection.itemId)}
          className="size-40 sm:size-48"
          rounded="rounded-lg"
        />
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            Public domain collection
          </p>
          <h1 className="mt-1 break-words text-3xl font-extrabold md:text-4xl">
            {collection.name}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">{collection.description}</p>
          <p className="mt-1 text-sm text-zinc-400">
            {collection.artist} · {tracks.length} tracks, {formatDuration(totalSec)} ·{' '}
            <a
              href={`https://archive.org/details/${collection.itemId}`}
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-white"
            >
              archive.org
            </a>
          </p>
          <button
            type="button"
            onClick={() => playQueue(tracks, 0)}
            disabled={tracks.length === 0}
            className="mt-4 flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 text-sm font-bold text-black transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            <PlayIcon width="16" height="16" />
            Play
          </button>
        </div>
      </div>
      {tracks.length > 0 ? (
        <TrackList tracks={tracks} onPlay={(i) => playQueue(tracks, i)} />
      ) : (
        <EmptyState title="No streamable tracks in this collection" />
      )}
    </>
  )
}
