import type { Track } from '../../types/model'
import { usePlayerStore } from '../../player/playerStore'
import { BroadcastIcon } from './icons'

/** Secondary action button that starts endless shuffled play of a track pool. */
export default function StartRadioButton({ tracks }: { tracks: Track[] }) {
  const startRadio = usePlayerStore((s) => s.startRadio)
  return (
    <button
      type="button"
      onClick={() => startRadio(tracks)}
      disabled={tracks.length === 0}
      title="Shuffle these tracks and loop them endlessly"
      className="flex items-center gap-2 rounded-full border border-zinc-600 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:border-white disabled:opacity-50"
    >
      <BroadcastIcon width="16" height="16" />
      Radio
    </button>
  )
}
