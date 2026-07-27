import { Link, useParams } from 'react-router'
import MediaCard from '../components/common/MediaCard'
import { PlayIcon } from '../components/common/icons'
import { EmptyState, ErrorMessage, Spinner } from '../components/common/Status'
import TrackList from '../components/tracks/TrackList'
import { useAsync } from '../hooks/useAsync'
import { classicalSubcategories, findClassicalSubcategory } from '../lib/classical'
import { findGenre } from '../lib/genres'
import { usePlayerStore } from '../player/playerStore'
import { archiveThumbnail, classicalCollections } from '../services/archive/api'
import { getTracksByGenre, getTracksByTags } from '../services/jamendo/api'

export default function GenrePage() {
  const { tag, sub } = useParams()
  const genre = tag ? findGenre(tag) : undefined
  const isClassical = tag === 'classical'
  const subcategory = isClassical && sub ? findClassicalSubcategory(sub) : undefined

  const state = useAsync(
    () =>
      subcategory
        ? getTracksByTags(['classical', subcategory.tag])
        : getTracksByGenre(tag!),
    [tag, subcategory?.slug],
    Boolean(tag),
    `genre:${tag}:${subcategory?.slug ?? ''}`,
  )
  const playQueue = usePlayerStore((s) => s.playQueue)

  const label = genre?.label ?? tag ?? 'Genre'
  const tracks = state.data

  const collections = isClassical
    ? subcategory
      ? classicalCollections.filter((c) => c.categories.includes(subcategory.slug))
      : classicalCollections
    : []

  return (
    <>
      <div
        className={`mb-8 flex min-h-36 flex-col justify-end rounded-xl bg-gradient-to-br p-6 ${
          genre?.color ?? 'from-zinc-600 to-zinc-800'
        }`}
      >
        <p className="text-xs font-medium uppercase tracking-wide text-white/70">
          {subcategory ? label : 'Genre'}
        </p>
        <h1 className="mt-1 text-3xl font-extrabold text-white md:text-5xl">
          {subcategory ? subcategory.label : label}
        </h1>
      </div>

      {isClassical && (
        <div className="mb-8 flex gap-2 overflow-x-auto pb-1">
          <Link
            to="/genre/classical"
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              !subcategory
                ? 'bg-white text-black'
                : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
            }`}
          >
            All
          </Link>
          {classicalSubcategories.map((s) => (
            <Link
              key={s.slug}
              to={`/genre/classical/${s.slug}`}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                subcategory?.slug === s.slug
                  ? 'bg-white text-black'
                  : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
              }`}
            >
              {s.label}
            </Link>
          ))}
        </div>
      )}

      {collections.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-1 text-lg font-bold">Masterworks</h2>
          <p className="mb-3 text-sm text-zinc-400">
            Public-domain recordings of the classical canon, streamed from the
            Internet Archive.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {collections.map((c) => (
              <MediaCard
                key={c.itemId}
                to={`/archive/${c.itemId}`}
                title={c.name}
                subtitle={c.artist}
                imageUrl={archiveThumbnail(c.itemId)}
              />
            ))}
          </div>
        </section>
      )}

      {isClassical && (
        <h2 className="mb-3 text-lg font-bold">
          {subcategory ? `${subcategory.label} on Jamendo` : 'Classical on Jamendo'}
        </h2>
      )}

      {tracks && tracks.length > 0 && (
        <button
          type="button"
          onClick={() => playQueue(tracks, 0)}
          className="mb-6 flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 text-sm font-bold text-black transition-colors hover:bg-accent-hover"
        >
          <PlayIcon width="16" height="16" />
          Play
        </button>
      )}

      {state.loading && <Spinner />}
      {state.error && <ErrorMessage error={state.error} />}
      {tracks &&
        (tracks.length > 0 ? (
          <TrackList tracks={tracks} onPlay={(i) => playQueue(tracks, i)} />
        ) : (
          <EmptyState
            title={`No ${subcategory?.label ?? label} tracks found`}
          />
        ))}
    </>
  )
}
