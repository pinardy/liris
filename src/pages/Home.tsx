import { useRef } from 'react'
import { Link } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import PageHeading from '../components/common/PageHeading'
import MediaCard from '../components/common/MediaCard'
import { EmptyState, ErrorMessage, Spinner } from '../components/common/Status'
import TrackList from '../components/tracks/TrackList'
import { useAsync } from '../hooks/useAsync'
import { useGenreOrder } from '../hooks/useGenreOrder'
import { usePlayerStore } from '../player/playerStore'
import { getRecentTracks } from '../services/db/recents'
import {
  getPopularAlbums,
  getRadios,
  getRadioTrack,
  getTrendingTracks,
  type RadioStation,
} from '../services/jamendo/api'
import ArtworkImage from '../components/common/ArtworkImage'
import { PlayIcon } from '../components/common/icons'

export default function Home() {
  const tracksState = useAsync(() => getTrendingTracks(20), [], true, 'home:trending')
  const albumsState = useAsync(() => getPopularAlbums(12), [], true, 'home:albums')
  const radiosState = useAsync(() => getRadios(12), [], true, 'home:radios')
  const recentTracks = useLiveQuery(() => getRecentTracks(8), [])
  const playQueue = usePlayerStore((s) => s.playQueue)
  const playTrack = usePlayerStore((s) => s.playTrack)
  const { orderedGenres, moveGenre } = useGenreOrder()
  const dragTag = useRef<string | null>(null)

  async function playRadio(station: RadioStation) {
    try {
      playTrack(await getRadioTrack(station))
    } catch (err) {
      console.error('Could not start radio', err)
    }
  }

  return (
    <>
      <PageHeading title="Home" />

      <div className="mb-8 flex gap-2 overflow-x-auto pb-1">
        {orderedGenres.slice(0, 10).map((genre) => (
          <Link
            key={genre.tag}
            to={`/genre/${genre.tag}`}
            draggable
            title="Drag to reorder"
            onDragStart={() => {
              dragTag.current = genre.tag
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              if (dragTag.current) moveGenre(dragTag.current, genre.tag)
              dragTag.current = null
            }}
            className="shrink-0 cursor-grab rounded-full bg-zinc-800 px-4 py-1.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-700 active:cursor-grabbing"
          >
            {genre.label}
          </Link>
        ))}
        <Link
          to="/search"
          className="shrink-0 rounded-full bg-zinc-800 px-4 py-1.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-700"
        >
          All genres →
        </Link>
      </div>

      {radiosState.data && radiosState.data.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-bold">Radio</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {radiosState.data.map((station) => (
              <button
                key={station.name}
                type="button"
                onClick={() => void playRadio(station)}
                className="group w-28 shrink-0 text-left"
              >
                <span className="relative block">
                  <ArtworkImage
                    src={station.imageUrl}
                    className="aspect-square w-full"
                    rounded="rounded-lg"
                  />
                  <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <PlayIcon width="28" height="28" className="text-white" />
                  </span>
                </span>
                <span className="mt-1.5 block truncate text-xs font-medium">
                  {station.dispName}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {recentTracks && recentTracks.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-bold">Recently played</h2>
          <TrackList tracks={recentTracks} onPlay={(i) => playQueue(recentTracks, i)} />
        </section>
      )}

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-bold">Trending this week</h2>
        {tracksState.loading && <Spinner />}
        {tracksState.error && <ErrorMessage error={tracksState.error} />}
        {tracksState.data &&
          (tracksState.data.length > 0 ? (
            <TrackList
              tracks={tracksState.data}
              onPlay={(i) => playQueue(tracksState.data!, i)}
            />
          ) : (
            <EmptyState title="Nothing trending right now" />
          ))}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Popular albums</h2>
        {albumsState.loading && <Spinner />}
        {albumsState.error && <ErrorMessage error={albumsState.error} />}
        {albumsState.data && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {albumsState.data.map((album) => (
              <MediaCard
                key={album.id}
                to={`/album/${album.id}`}
                title={album.name}
                subtitle={album.artist}
                imageUrl={album.artworkUrl}
              />
            ))}
          </div>
        )}
      </section>
    </>
  )
}
