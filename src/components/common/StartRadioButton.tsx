import type { Track } from '../../types/model'
import { usePlayerStore } from '../../player/playerStore'
import { buttonClass } from './buttonStyles'
import { BroadcastIcon } from './icons'

/**
 * Secondary action button that starts endless shuffled play. Each group is a
 * whole work: order is shuffled between works, never within one.
 */
export default function StartRadioButton({ groups }: { groups: Track[][] }) {
  const startRadio = usePlayerStore((s) => s.startRadio)
  return (
    <button
      type="button"
      onClick={() => startRadio(groups)}
      disabled={groups.length === 0}
      title="Shuffle these works — each plays complete — and loop endlessly"
      className={buttonClass('outline')}
    >
      <BroadcastIcon width="16" height="16" />
      Radio
    </button>
  )
}
