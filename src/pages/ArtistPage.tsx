import { useParams } from 'react-router'
import ArtworkImage from '../components/common/ArtworkImage'
import { PlayIcon } from '../components/common/icons'
import { EmptyState, ErrorMessage, Spinner } from '../components/common/Status'
import TrackList from '../components/tracks/TrackList'
import { useAsync } from '../hooks/useAsync'
import { usePlayerStore } from '../player/playerStore'
import { getArtistWithTracks } from '../services/jamendo/api'

export default function ArtistPage() {
  const { id } = useParams()
  const state = useAsync(() => getArtistWithTracks(id!), [id], Boolean(id), `artist:${id}`)
  const playQueue = usePlayerStore((s) => s.playQueue)

  if (state.loading) return <Spinner />
  if (state.error) return <ErrorMessage error={state.error} />
  if (!state.data) return <EmptyState title="Artist not found" />

  const { artist, tracks } = state.data

  return (
    <>
      <div className="mb-8 flex flex-col items-start gap-5 sm:flex-row sm:items-end">
        <ArtworkImage
          src={artist.imageUrl}
          className="size-40 sm:size-48"
          rounded="rounded-full"
        />
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Artist</p>
          <h1 className="mt-1 break-words text-3xl font-extrabold md:text-4xl">
            {artist.name}
          </h1>
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
      <h2 className="mb-3 text-lg font-bold">Tracks</h2>
      {tracks.length > 0 ? (
        <TrackList tracks={tracks} onPlay={(i) => playQueue(tracks, i)} />
      ) : (
        <EmptyState title="No tracks available for this artist" />
      )}
    </>
  )
}
