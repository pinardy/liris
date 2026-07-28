import { useLiveQuery } from 'dexie-react-hooks'
import type { Track } from '../../types/model'
import { db } from '../../services/db/db'
import { setFavorites } from '../../services/db/favorites'
import { HeartIcon } from '../common/icons'

/**
 * Heart for a whole work: filled when every movement of the shown recording
 * is a favorite; toggling favorites/unfavorites all of them together.
 */
export default function FavoriteWorkButton({ tracks }: { tracks: Track[] }) {
  const favoriteIds = useLiveQuery(
    () => db.favorites.toArray().then((rows) => new Set(rows.map((r) => r.trackId))),
    [],
  )
  if (tracks.length === 0) return null

  const allFavorite =
    favoriteIds !== undefined && tracks.every((t) => favoriteIds.has(t.id))

  return (
    <button
      type="button"
      onClick={() => void setFavorites(tracks, !allFavorite)}
      aria-pressed={allFavorite}
      aria-label={allFavorite ? 'Remove work from favorites' : 'Favorite this work'}
      title={
        allFavorite
          ? 'Remove all movements from favorites'
          : 'Favorite this work — all movements at once'
      }
      className={`flex items-center justify-center rounded-full border px-3.5 transition-colors ${
        allFavorite
          ? 'border-accent text-accent hover:border-accent-hover hover:text-accent-hover'
          : 'border-zinc-600 text-white hover:border-white'
      }`}
    >
      <HeartIcon width="18" height="18" fill={allFavorite ? 'currentColor' : 'none'} />
    </button>
  )
}
