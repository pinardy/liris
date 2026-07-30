import { useMemo, useState } from 'react'
import { AsyncGate, EmptyState } from '../components/common/Status'
import { useClassicalIndex } from '../hooks/useClassicalIndex'
import { workTracks, type Work } from '../lib/classical'
import { type Composer } from '../lib/composers'
import { shuffled } from '../player/queue'
import QuizDone from './quiz/QuizDone'
import QuizIntro from './quiz/QuizIntro'
import QuizRound from './quiz/QuizRound'
import { useClipPlayer } from './quiz/useClipPlayer'
import {
  MODES,
  ROUNDS,
  answerKey,
  buildChoices,
  clipUrl,
  difficultyDef,
  isEligible,
  type Difficulty,
  type QuizMode,
  type Round,
} from './quiz/quiz'

/**
 * Blind-listening quiz: a clip from somewhere inside a random catalog work,
 * with N answer choices over ten rounds. Modes ask for the composer, the
 * period, or the form; difficulty tunes the number of choices and clip length.
 * The clip plays through its own audio element (see useClipPlayer) so the real
 * player never spoils the answer.
 */
export default function QuizPage() {
  const { data: index, error, loading } = useClassicalIndex()

  const [mode, setMode] = useState<QuizMode>('composer')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [phase, setPhase] = useState<'intro' | 'round' | 'done'>('intro')
  const [rounds, setRounds] = useState<Round[]>([])
  const [spares, setSpares] = useState<Work[]>([])
  const [roundNo, setRoundNo] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [clipFailed, setClipFailed] = useState(false)

  const diff = difficultyDef(difficulty)

  // Composers that actually appear in the catalog — the decoy pool.
  const catalogComposers = useMemo(
    () =>
      (index?.composers ?? [])
        .map((e) => e.composer)
        .filter((c): c is Composer => c !== undefined),
    [index],
  )

  function playClip(work: Work) {
    const tracks = workTracks(work).filter((t) => clipUrl(t))
    const track = tracks[Math.floor(Math.random() * tracks.length)]
    setClipFailed(false)
    play(clipUrl(track)!)
  }

  /** A clip that won't load gets its work swapped out for a spare. */
  function handleClipError() {
    if (picked !== null || phase !== 'round') return
    const next = spares[0]
    if (!next) {
      setClipFailed(true)
      return
    }
    setSpares(spares.slice(1))
    setRounds(rounds.map((round, i) => (i === roundNo ? makeRound(next) : round)))
    playClip(next)
  }

  const { progress: clipProgress, play, replay, pause } = useClipPlayer(
    handleClipError,
    diff.clipSec,
  )

  if (loading || error) return <AsyncGate loading={loading} error={error} />
  if (!index) return <EmptyState title="Catalog unavailable" />

  const eligible = index.works.filter((w) => isEligible(mode, w))
  // Decoys come from all catalog composers, but only distinct present answers
  // for period/form — so the answerable pool differs by mode.
  const answerPool =
    mode === 'composer'
      ? catalogComposers.length
      : new Set(eligible.map((w) => answerKey(mode, w))).size
  const modeLabel = MODES.find((m) => m.id === mode)!.label.toLowerCase()

  if (eligible.length === 0 || answerPool < 2) {
    return (
      <EmptyState title={`Not enough loaded to quiz by ${modeLabel}`}>
        Load more of the catalog, or try a different quiz mode.
      </EmptyState>
    )
  }

  const choiceCount = Math.min(diff.choices, answerPool)

  function makeRound(work: Work): Round {
    const key = answerKey(mode, work)!
    return {
      work,
      answer: key,
      choices: buildChoices(mode, key, choiceCount, diff.affinity, {
        composers: catalogComposers,
        works: eligible,
      }),
    }
  }

  function start() {
    // Prefer a different answer every round; pad with repeats if needed.
    const pool = shuffled(eligible)
    const seen = new Set<string>()
    const pickedWorks: Work[] = []
    for (const w of pool) {
      if (pickedWorks.length >= ROUNDS) break
      const key = answerKey(mode, w)!
      if (seen.has(key)) continue
      seen.add(key)
      pickedWorks.push(w)
    }
    for (const w of pool) {
      if (pickedWorks.length >= ROUNDS) break
      if (!pickedWorks.includes(w)) pickedWorks.push(w)
    }
    const newRounds = pickedWorks.map(makeRound)
    setRounds(newRounds)
    setSpares(pool.filter((w) => !pickedWorks.includes(w)))
    setScore(0)
    setRoundNo(0)
    setPicked(null)
    setPhase('round')
    playClip(newRounds[0].work)
  }

  function answer(key: string) {
    if (picked !== null || clipFailed) return
    setPicked(key)
    if (key === rounds[roundNo].answer) setScore((s) => s + 1)
    pause()
  }

  function nextRound() {
    if (roundNo + 1 >= rounds.length) {
      setPhase('done')
      pause()
      return
    }
    setPicked(null)
    setRoundNo((n) => n + 1)
    playClip(rounds[roundNo + 1].work)
  }

  if (phase === 'intro') {
    return (
      <QuizIntro
        rounds={ROUNDS}
        mode={mode}
        difficulty={difficulty}
        onMode={setMode}
        onDifficulty={setDifficulty}
        onStart={start}
      />
    )
  }

  if (phase === 'done') {
    return <QuizDone score={score} total={rounds.length} onRestart={start} />
  }

  const round = rounds[roundNo]
  return (
    <QuizRound
      question={MODES.find((m) => m.id === mode)!.question}
      roundNo={roundNo}
      total={rounds.length}
      score={score}
      work={round.work}
      choices={round.choices}
      answer={round.answer}
      picked={picked}
      clipFailed={clipFailed}
      clipProgress={clipProgress}
      onReplay={replay}
      onAnswer={answer}
      onNext={nextRound}
    />
  )
}
