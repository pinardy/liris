import { Link } from 'react-router'
import ComposerAvatar from '../../components/classical/ComposerAvatar'
import PlayButton from '../../components/common/PlayButton'
import type { Work } from '../../lib/classical'
import type { Choice } from './quiz'

interface Props {
  question: string
  roundNo: number
  total: number
  score: number
  work: Work
  choices: Choice[]
  /** The correct choice key. */
  answer: string
  /** Key the player picked, or null before they answer. */
  picked: string | null
  clipFailed: boolean
  clipProgress: number
  onReplay: () => void
  onAnswer: (key: string) => void
  onNext: () => void
}

/** One quiz round: the clip player, N answer choices, and the reveal. Mode-
 *  agnostic — a choice renders with a portrait when it carries `avatarSlug`. */
export default function QuizRound({
  question,
  roundNo,
  total,
  score,
  work,
  choices,
  answer,
  picked,
  clipFailed,
  clipProgress,
  onReplay,
  onAnswer,
  onNext,
}: Props) {
  const correctLabel = choices.find((c) => c.key === answer)?.label ?? ''
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
            <div className="min-w-0 flex-1">
              <p className="mb-2 text-sm font-medium text-zinc-300">{question}</p>
              <div className="h-1.5 overflow-hidden rounded-full bg-zinc-700">
                <div
                  className="h-full rounded-full bg-accent transition-[width] duration-300 ease-linear"
                  style={{ width: `${clipProgress * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}
        {picked !== null && (
          <p className="mt-4 text-sm text-zinc-300">
            {picked === answer ? 'Right — ' : 'It was '}
            <span className="font-semibold">{correctLabel}</span>.{' '}
            <Link to={`/work/${work.id}`} className="hover:underline">
              {work.title}
            </Link>{' '}
            — {work.composerName}.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {choices.map((c) => {
          const state =
            picked === null
              ? 'idle'
              : c.key === answer
                ? 'correct'
                : c.key === picked
                  ? 'wrong'
                  : 'dimmed'
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => onAnswer(c.key)}
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
              {c.avatarSlug ? (
                <ComposerAvatar
                  slug={c.avatarSlug}
                  name={c.label}
                  className="size-10"
                  width={80}
                />
              ) : (
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-400">
                  {c.label.slice(0, 2)}
                </span>
              )}
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{c.label}</span>
                {c.sublabel && (
                  <span className="block truncate text-xs text-zinc-500">{c.sublabel}</span>
                )}
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
