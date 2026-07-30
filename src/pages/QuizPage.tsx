import { useMemo, useState } from 'react'
import { AsyncGate, EmptyState } from '../components/common/Status'
import { useClassicalIndex } from '../hooks/useClassicalIndex'
import { workTracks, type Work } from '../lib/classical'
import { composerBySlug, type Composer } from '../lib/composers'
import { shuffled } from '../player/queue'
import type { Track } from '../types/model'
import QuizDone from './quiz/QuizDone'
import QuizIntro from './quiz/QuizIntro'
import QuizRound from './quiz/QuizRound'
import { CLIP_SEC, useClipPlayer } from './quiz/useClipPlayer'

const ROUNDS = 10
const CHOICES = 4

interface Round {
  work: Work
  choices: Composer[]
}

function clipUrl(track: Track): string | undefined {
  return track.archive?.audioUrl ?? track.jamendo?.audioUrl
}

function isEligible(work: Work): boolean {
  return (
    work.composerSlug !== undefined &&
    composerBySlug(work.composerSlug) !== undefined &&
    workTracks(work).some((t) => clipUrl(t))
  )
}

/** Correct composer plus period-matched decoys, in random order. */
function buildChoices(work: Work, all: Composer[]): Composer[] {
  const correct = composerBySlug(work.composerSlug!)!
  const others = shuffled(all.filter((c) => c.slug !== correct.slug))
  // Same-period decoys make it a music question, not a dates question.
  const decoys = [
    ...others.filter((c) => c.period === correct.period),
    ...others.filter((c) => c.period !== correct.period),
  ].slice(0, CHOICES - 1)
  return shuffled([correct, ...decoys])
}

/**
 * Blind-listening quiz: a clip from somewhere inside a random work from the
 * catalog, four composers, ten rounds. The clip plays through its own audio
 * element (see useClipPlayer) so the real player never spoils the answer.
 */
export default function QuizPage() {
  const { data: index, error, loading } = useClassicalIndex()

  const [phase, setPhase] = useState<'intro' | 'round' | 'done'>('intro')
  const [rounds, setRounds] = useState<Round[]>([])
  const [spares, setSpares] = useState<Work[]>([])
  const [roundNo, setRoundNo] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [clipFailed, setClipFailed] = useState(false)

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
    setRounds(
      rounds.map((round, i) =>
        i === roundNo ? { work: next, choices: buildChoices(next, catalogComposers) } : round,
      ),
    )
    playClip(next)
  }

  const { progress: clipProgress, play, replay, pause } = useClipPlayer(handleClipError)

  if (loading || error) return <AsyncGate loading={loading} error={error} />
  if (!index) return <EmptyState title="Catalog unavailable" />

  const eligible = index.works.filter(isEligible)
  const distinctComposers = new Set(eligible.map((w) => w.composerSlug)).size
  if (distinctComposers < CHOICES) {
    return (
      <EmptyState title="Not enough composers loaded for a quiz">
        The quiz needs works from at least {CHOICES} composers in the catalog.
      </EmptyState>
    )
  }

  function start() {
    // Prefer a different composer every round; pad with repeats if needed.
    const pool = shuffled(eligible)
    const seen = new Set<string>()
    const pickedWorks: Work[] = []
    for (const w of pool) {
      if (pickedWorks.length >= ROUNDS) break
      if (seen.has(w.composerSlug!)) continue
      seen.add(w.composerSlug!)
      pickedWorks.push(w)
    }
    for (const w of pool) {
      if (pickedWorks.length >= ROUNDS) break
      if (!pickedWorks.includes(w)) pickedWorks.push(w)
    }
    const newRounds = pickedWorks.map((work) => ({
      work,
      choices: buildChoices(work, catalogComposers),
    }))
    setRounds(newRounds)
    setSpares(pool.filter((w) => !pickedWorks.includes(w)))
    setScore(0)
    setRoundNo(0)
    setPicked(null)
    setPhase('round')
    playClip(newRounds[0].work)
  }

  function answer(slug: string) {
    if (picked !== null || clipFailed) return
    setPicked(slug)
    if (slug === rounds[roundNo].work.composerSlug) setScore((s) => s + 1)
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
    return <QuizIntro rounds={ROUNDS} clipSec={CLIP_SEC} onStart={start} />
  }

  if (phase === 'done') {
    return <QuizDone score={score} total={rounds.length} onRestart={start} />
  }

  const round = rounds[roundNo]
  return (
    <QuizRound
      roundNo={roundNo}
      total={rounds.length}
      score={score}
      work={round.work}
      choices={round.choices}
      picked={picked}
      clipFailed={clipFailed}
      clipProgress={clipProgress}
      onReplay={replay}
      onAnswer={answer}
      onNext={nextRound}
    />
  )
}
