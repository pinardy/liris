import { formatDuration } from '../../lib/format'
import { toast } from '../../lib/toast'
import { usePlayerStore, selectCurrentTrack } from '../../player/playerStore'
import { addBookmark } from '../../services/db/bookmarks'
import { BookmarkIcon } from '../common/icons'

/** Save the current track + position as a bookmark. Renders nothing when
 *  nothing (or a live radio stream) is playing. */
export default function BookmarkButton({ className }: { className?: string }) {
  const track = usePlayerStore(selectCurrentTrack)
  if (!track || track.id.startsWith('radio:')) return null

  async function save() {
    const s = usePlayerStore.getState()
    const current = s.queue[s.currentIndex]
    if (!current) return
    await addBookmark(current, s.positionSec)
    toast(`Bookmarked at ${formatDuration(s.positionSec)} — ${current.title}`)
  }

  return (
    <button
      type="button"
      onClick={() => void save()}
      aria-label="Bookmark this position"
      title="Bookmark this position"
      className={`flex size-11 items-center justify-center ${className ?? 'text-zinc-400 hover:text-white'}`}
    >
      <BookmarkIcon width="18" height="18" />
    </button>
  )
}
