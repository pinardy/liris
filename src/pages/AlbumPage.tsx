import { Link, useParams } from 'react-router'
import ArtworkImage from '../components/common/ArtworkImage'
import { PlayIcon } from '../components/common/icons'
import { EmptyState, ErrorMessage, Spinner } from '../components/common/Status'
import TrackList from '../components/tracks/TrackList'
import { useAsync } from '../hooks/useAsync'
import { formatDuration } from '../lib/format'
import { usePlayerStore } from '../player/playerStore'
import { getAlbumWithTracks } from '../services/jamendo/api'

export default function AlbumPage() {
  const { id } = useParams()
  const state = useAsync(() => getAlbumWithTracks(id!), [id], Boolean(id), `album:${id}`)
  const playQueue = usePlayerStore((s) => s.playQueue)

  if (state.loading) return <Spinner />
  if (state.error) return <ErrorMessage error={state.error} />
  if (!state.data) return <EmptyState title="Album not found" />

  const { album, tracks } = state.data
  const totalSec = tracks.reduce((sum, t) => sum + t.durationSec, 0)

  return (
    <>
      <div className="mb-8 flex flex-col items-start gap-5 sm:flex-row sm:items-end">
        <ArtworkImage src={album.artworkUrl} className="size-40 sm:size-48" rounded="rounded-lg" />
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Album</p>
          <h1 className="mt-1 break-words text-3xl font-extrabold md:text-4xl">{album.name}</h1>
          <p className="mt-2 text-sm text-zinc-400">
            {album.artistId ? (
              <Link to={`/artist/${album.artistId}`} className="font-medium text-white hover:underline">
                {album.artist}
              </Link>
            ) : (
              <span className="font-medium text-white">{album.artist}</span>
            )}
            {album.releaseDate && <> · {album.releaseDate.slice(0, 4)}</>}
            {' · '}
            {tracks.length} tracks, {formatDuration(totalSec)}
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
        <EmptyState title="This album has no playable tracks" />
      )}
    </>
  )
}
