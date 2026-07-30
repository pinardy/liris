import { Link } from 'react-router'
import Button from '../../components/common/Button'
import { buttonClass } from '../../components/common/buttonStyles'

/** The results screen: final score, a verdict, and where to go next. */
export default function QuizDone({
  score,
  total,
  onRestart,
}: {
  score: number
  total: number
  onRestart: () => void
}) {
  const verdict =
    score === total
      ? 'Flawless — a conservatory ear.'
      : score >= 8
        ? 'Superb listening.'
        : score >= 5
          ? 'A promising ear — keep listening.'
          : 'Every great listener started here.'
  return (
    <div className="mx-auto max-w-xl py-10 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
        Final score
      </p>
      <h1 className="mt-2 text-5xl font-extrabold">
        {score} / {total}
      </h1>
      <p className="mt-3 text-sm text-zinc-400">{verdict}</p>
      <div className="mt-8 flex justify-center gap-3">
        <Button onClick={onRestart}>Play again</Button>
        <Link to="/composers" className={buttonClass('outline')}>
          Browse composers
        </Link>
      </div>
    </div>
  )
}
