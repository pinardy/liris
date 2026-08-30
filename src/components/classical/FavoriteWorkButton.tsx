import { useLiveQuery } from 'dexie-react-hooks'
import type { Track } from '../../types/model'
import { toast } from '../../lib/toast'
import { getFavoriteIds, setFavorites } from '../../services/db/favorites'
import { HeartIcon } from '../common/icons'

/**
 * Heart for a whole work: filled when every movement of the shown recording
 * is a favorite; toggling favorites/unfavorites all of them together.
 */
export default function FavoriteWorkButton({ tracks }: { tracks: Track[] }) {
  const favoriteIds = useLiveQuery(getFavoriteIds, [])
  if (tracks.length === 0) return null

  const allFavorite =
    favoriteIds !== undefined && tracks.every((t) => favoriteIds.has(t.id))

  // One click can drop every movement of a work, so the result is always
  // stated — with a way back when it removed something.
  async function toggle() {
    const on = !allFavorite
    await setFavorites(tracks, on)
    const count = `${tracks.length} movement${tracks.length === 1 ? '' : 's'}`
    if (on) {
      toast(`Favorited — ${count}`)
      return
    }
    toast(`Removed from favorites — ${count}`, {
      action: { label: 'Undo', onClick: () => void setFavorites(tracks, true) },
    })
  }

  return (
    <button
      type="button"
      onClick={() => void toggle()}
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
