import Button from '../../components/common/Button'
import { PlayIcon } from '../../components/common/icons'

/** The pre-game screen: rules and a start button. */
export default function QuizIntro({
  rounds,
  clipSec,
  onStart,
}: {
  rounds: number
  clipSec: number
  onStart: () => void
}) {
  return (
    <div className="mx-auto max-w-xl py-10 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
        Guess the composer
      </p>
      <h1 className="mt-2 text-3xl font-extrabold md:text-4xl">Test your ear</h1>
      <p className="mt-3 text-sm text-zinc-400">
        {rounds} blind clips from the catalog, {clipSec} seconds each, four
        composers to choose from. No titles, no artwork — just the music.
      </p>
      <Button size="lg" onClick={onStart} className="mt-8">
        <PlayIcon width="16" height="16" />
        Start quiz
      </Button>
    </div>
  )
}
