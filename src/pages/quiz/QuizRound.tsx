import { Link } from 'react-router'
import ComposerAvatar from '../../components/classical/ComposerAvatar'
import PlayButton from '../../components/common/PlayButton'
import type { Work } from '../../lib/classical'
import type { Composer } from '../../lib/composers'

interface Props {
  roundNo: number
  total: number
  score: number
  work: Work
  choices: Composer[]
  /** Slug the player picked, or null before they answer. */
  picked: string | null
  clipFailed: boolean
  clipProgress: number
  onReplay: () => void
  onAnswer: (slug: string) => void
  onNext: () => void
}

/** One quiz round: the clip player, four composer choices, and the reveal. */
export default function QuizRound({
  roundNo,
  total,
  score,
  work,
  choices,
  picked,
  clipFailed,
  clipProgress,
  onReplay,
  onAnswer,
  onNext,
}: Props) {
  const correctSlug = work.composerSlug!
  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-xl font-bold">
          Round {roundNo + 1} <span className="text-zinc-500">of {total}</span>
        </h1>
        <p className="text-sm tabular-nums text-zinc-400">Score {score}</p>
      </div>

      <div className="mb-6 rounded-xl bg-zinc-900/70 p-5">
        {clipFailed ? (
          <p className="text-sm text-zinc-400">
            This clip refused to load — skip the round below.
          </p>
        ) : (
          <div className="flex items-center gap-4">
            <PlayButton onClick={onReplay} aria-label="Replay clip" />
            <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-zinc-700">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-300 ease-linear"
                style={{ width: `${clipProgress * 100}%` }}
              />
            </div>
          </div>
        )}
        {picked !== null && (
          <p className="mt-4 text-sm text-zinc-300">
            {picked === correctSlug ? 'Right — ' : 'It was '}
            <Link to={`/work/${work.id}`} className="font-semibold hover:underline">
              {work.title}
            </Link>{' '}
            by {work.composerName}.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {choices.map((c) => {
          const state =
            picked === null
              ? 'idle'
              : c.slug === correctSlug
                ? 'correct'
                : c.slug === picked
                  ? 'wrong'
                  : 'dimmed'
          return (
            <button
              key={c.slug}
              type="button"
              onClick={() => onAnswer(c.slug)}
              disabled={picked !== null || clipFailed}
              className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                state === 'correct'
                  ? 'border-green-500 bg-green-500/10'
                  : state === 'wrong'
                    ? 'border-red-500 bg-red-500/10'
                    : state === 'dimmed'
                      ? 'border-zinc-800 opacity-50'
                      : 'border-zinc-700 hover:border-zinc-400'
              }`}
            >
              <ComposerAvatar slug={c.slug} name={c.surname} className="size-10" width={80} />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{c.name}</span>
                <span className="block text-xs text-zinc-500">
                  {c.period}
                  {c.born && ` · ${c.born}–${c.died ?? ''}`}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      {(picked !== null || clipFailed) && (
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onNext}
            className="rounded-full bg-white px-6 py-2.5 text-sm font-bold text-black transition-colors hover:bg-zinc-200"
          >
            {roundNo + 1 >= total ? 'See results' : 'Next round'}
          </button>
        </div>
      )}
    </div>
  )
}
