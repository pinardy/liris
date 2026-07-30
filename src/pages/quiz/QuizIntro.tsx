import Button from '../../components/common/Button'
import { PlayIcon } from '../../components/common/icons'
import {
  DIFFICULTIES,
  MODES,
  difficultyDef,
  type Difficulty,
  type QuizMode,
} from './quiz'

interface Props {
  rounds: number
  mode: QuizMode
  difficulty: Difficulty
  onMode: (mode: QuizMode) => void
  onDifficulty: (difficulty: Difficulty) => void
  onStart: () => void
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { id: T; label: string }[]
  onChange: (value: T) => void
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <div className="inline-flex gap-1 rounded-full bg-zinc-800 p-1">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            aria-pressed={value === o.id}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              value === o.id
                ? 'bg-accent text-black'
                : 'text-zinc-300 hover:text-white'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

/** The pre-game screen: pick a mode and difficulty, then start. */
export default function QuizIntro({
  rounds,
  mode,
  difficulty,
  onMode,
  onDifficulty,
  onStart,
}: Props) {
  const diff = difficultyDef(difficulty)
  return (
    <div className="mx-auto max-w-xl py-10 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
        Blind listening
      </p>
      <h1 className="mt-2 text-3xl font-extrabold md:text-4xl">Test your ear</h1>
      <p className="mt-3 text-sm text-zinc-400">
        {rounds} blind clips from the catalog, {diff.clipSec} seconds each,{' '}
        {diff.choices} choices. No titles, no artwork — just the music.
      </p>

      <div className="mt-8 flex flex-col items-center gap-5">
        <Segmented label="Guess the" value={mode} options={MODES} onChange={onMode} />
        <Segmented
          label="Difficulty"
          value={difficulty}
          options={DIFFICULTIES}
          onChange={onDifficulty}
        />
      </div>

      <Button size="lg" onClick={onStart} className="mt-8">
        <PlayIcon width="16" height="16" />
        Start quiz
      </Button>
    </div>
  )
}
