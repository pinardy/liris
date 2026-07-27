import { Link, useSearchParams } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import PageHeading from '../components/common/PageHeading'
import MediaCard from '../components/common/MediaCard'
import { EmptyState, ErrorMessage, Spinner } from '../components/common/Status'
import { SearchIcon } from '../components/common/icons'
import TrackList from '../components/tracks/TrackList'
import { useAsync } from '../hooks/useAsync'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { useGenreOrder } from '../hooks/useGenreOrder'
import { usePlayerStore } from '../player/playerStore'
import { db } from '../services/db/db'
import { searchAlbums, searchArtists, searchTracks } from '../services/jamendo/api'

const TABS = ['tracks', 'albums', 'artists'] as const
type Tab = (typeof TABS)[number]

export default function Search() {
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const tab = (params.get('tab') as Tab) || 'tracks'
  const debouncedQuery = useDebouncedValue(query.trim(), 400)
  const enabled = debouncedQuery.length > 0

  const playQueue = usePlayerStore((s) => s.playQueue)
  const { orderedGenres } = useGenreOrder()

  const tracksState = useAsync(
    () => searchTracks(debouncedQuery),
    [debouncedQuery],
    enabled && tab === 'tracks',
    `search:tracks:${debouncedQuery}`,
  )
  const albumsState = useAsync(
    () => searchAlbums(debouncedQuery),
    [debouncedQuery],
    enabled && tab === 'albums',
    `search:albums:${debouncedQuery}`,
  )
  const artistsState = useAsync(
    () => searchArtists(debouncedQuery),
    [debouncedQuery],
    enabled && tab === 'artists',
    `search:artists:${debouncedQuery}`,
  )

  // Unified search: also match the local collection (imported files plus
  // playlisted/favorited/downloaded track snapshots) stored in Dexie.
  const collectionTracks = useLiveQuery(async () => {
    const q = debouncedQuery.toLowerCase()
    if (!q) return []
    const all = await db.tracks.toArray()
    return all
      .filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.artist.toLowerCase().includes(q) ||
          (t.album ?? '').toLowerCase().includes(q),
      )
      .slice(0, 10)
  }, [debouncedQuery])

  function update(patch: { q?: string; tab?: Tab }) {
    const next = new URLSearchParams(params)
    if (patch.q !== undefined) {
      if (patch.q) next.set('q', patch.q)
      else next.delete('q')
    }
    if (patch.tab) next.set('tab', patch.tab)
    setParams(next, { replace: true })
  }

  return (
    <>
      <PageHeading title="Search" />

      <div className="relative mb-4 max-w-xl">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          type="search"
          value={query}
          onChange={(e) => update({ q: e.target.value })}
          placeholder="What do you want to listen to?"
          autoFocus
          className="w-full rounded-full bg-zinc-800 py-2.5 pl-11 pr-4 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/30"
        />
      </div>

      <div className={`mb-6 flex gap-2 ${enabled ? '' : 'hidden'}`}>
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => update({ tab: t })}
            className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
              tab === t
                ? 'bg-white text-black'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {!enabled && (
        <section>
          <h2 className="mb-3 text-lg font-bold">Browse all</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {orderedGenres.map((genre) => (
              <Link
                key={genre.tag}
                to={`/genre/${genre.tag}`}
                className={`flex aspect-[2/1] items-end rounded-lg bg-gradient-to-br p-3 transition-transform hover:scale-[1.02] ${genre.color}`}
              >
                <span className="text-lg font-bold text-white drop-shadow">
                  {genre.label}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {enabled && tab === 'tracks' && (
        <>
          {collectionTracks && collectionTracks.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-2 text-lg font-bold">From your collection</h2>
              <TrackList
                tracks={collectionTracks}
                onPlay={(i) => playQueue(collectionTracks, i)}
              />
              <h2 className="mb-2 mt-8 text-lg font-bold">From Jamendo</h2>
            </section>
          )}
          {tracksState.loading && <Spinner />}
          {tracksState.error && <ErrorMessage error={tracksState.error} />}
          {tracksState.data &&
            (tracksState.data.length > 0 ? (
              <TrackList
                tracks={tracksState.data}
                onPlay={(i) => playQueue(tracksState.data!, i)}
              />
            ) : (
              <EmptyState title={`No tracks found for “${debouncedQuery}”`} />
            ))}
        </>
      )}

      {enabled && tab === 'albums' && (
        <>
          {albumsState.loading && <Spinner />}
          {albumsState.error && <ErrorMessage error={albumsState.error} />}
          {albumsState.data &&
            (albumsState.data.length > 0 ? (
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
            ) : (
              <EmptyState title={`No albums found for “${debouncedQuery}”`} />
            ))}
        </>
      )}

      {enabled && tab === 'artists' && (
        <>
          {artistsState.loading && <Spinner />}
          {artistsState.error && <ErrorMessage error={artistsState.error} />}
          {artistsState.data &&
            (artistsState.data.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {artistsState.data.map((artist) => (
                  <MediaCard
                    key={artist.id}
                    to={`/artist/${artist.id}`}
                    title={artist.name}
                    subtitle="Artist"
                    imageUrl={artist.imageUrl}
                    round
                  />
                ))}
              </div>
            ) : (
              <EmptyState title={`No artists found for “${debouncedQuery}”`} />
            ))}
        </>
      )}
    </>
  )
}
