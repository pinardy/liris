import { Link, useParams } from 'react-router'
import ArtworkImage from '../components/common/ArtworkImage'
import { PlayIcon } from '../components/common/icons'
import { EmptyState, ErrorMessage, Spinner } from '../components/common/Status'
import WorkRow from '../components/classical/WorkRow'
import { useClassicalIndex } from '../hooks/useClassicalIndex'
import { usePlayerStore } from '../player/playerStore'
import { archiveThumbnail, classicalCollections } from '../services/archive/api'

/** One source edition, shown as the works it contributes. */
export default function CollectionPage() {
  const { itemId } = useParams()
  const { data: index, error, loading } = useClassicalIndex()
  const playQueue = usePlayerStore((s) => s.playQueue)

  const collection = classicalCollections.find((c) => c.itemId === itemId)
  if (!collection) return <EmptyState title="Collection not found" />
  if (loading) return <Spinner />
  if (error) return <ErrorMessage error={error} />

  const works = (index?.works ?? []).filter((w) =>
    w.recordings.some((r) => r.collectionId === collection.itemId),
  )
  const tracks = works.flatMap((w) => {
    const rec =
      w.recordings.find((r) => r.collectionId === collection.itemId) ?? w.recordings[0]
    return rec.tracks
  })

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
            Collection
          </p>
          <h1 className="mt-1 break-words text-3xl font-extrabold md:text-4xl">
            {collection.name}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">{collection.description}</p>
          <p className="mt-1 text-sm text-zinc-400">
            {collection.artist} · {works.length} works · {tracks.length} movements
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            {collection.license} ·{' '}
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

      {collection.license === 'Unverified' && (
        <div className="mb-6 rounded-lg border border-amber-900/50 bg-amber-950/30 p-3 text-xs text-amber-300">
          The compositions in this set are long out of copyright, but this upload
          carries no licence statement, so the status of these particular
          recordings is unverified.
        </div>
      )}

      {works.length > 0 ? (
        <div className="flex flex-col">
          {works.map((work) => (
            <WorkRow key={work.id} work={work} showComposer />
          ))}
        </div>
      ) : (
        <EmptyState title="No works loaded from this collection" />
      )}

      <p className="mt-6 text-xs text-zinc-600">
        <Link to="/" className="hover:underline">
          ← All collections
        </Link>
      </p>
    </>
  )
}
