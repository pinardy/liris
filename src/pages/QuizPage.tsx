import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import ComposerAvatar from '../components/classical/ComposerAvatar'
import { PlayIcon } from '../components/common/icons'
import { EmptyState, ErrorMessage, Spinner } from '../components/common/Status'
import { useClassicalIndex } from '../hooks/useClassicalIndex'
import { workTracks, type Work } from '../lib/classical'
import { composerBySlug, type Composer } from '../lib/composers'
import { shuffled } from '../player/queue'
import { usePlayerStore } from '../player/playerStore'
import type { Track } from '../types/model'

const ROUNDS = 10
const CLIP_SEC = 20
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
 * catalog, four composers, ten rounds. Uses its own audio element so the real
 * player (and its now-playing UI) never spoils the answer.
 */
export default function QuizPage() {
  const { data: index, error, loading } = useClassicalIndex()

  const [phase, setPhase] = useState<'intro' | 'round' | 'done'>('intro')
  const [rounds, setRounds] = useState<Round[]>([])
  const [spares, setSpares] = useState<Work[]>([])
  const [roundNo, setRoundNo] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [clipProgress, setClipProgress] = useState(0)
  const [clipFailed, setClipFailed] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const clipStartRef = useRef<number | null>(null)
  const answeredRef = useRef(false)
  answeredRef.current = picked !== null
  // The element's 'error' listener is bound once, but must see the current
  // round/spares — refreshed every render via this ref.
  const clipErrorRef = useRef<() => void>(() => {})

  // Composers that actually appear in the catalog — the decoy pool.
  const catalogComposers = useMemo(
    () =>
      (index?.composers ?? [])
        .map((e) => e.composer)
        .filter((c): c is Composer => c !== undefined),
    [index],
  )

  // One element for the page's lifetime, silenced on unmount.
  useEffect(() => {
    const el = new Audio()
    el.preload = 'auto'
    audioRef.current = el

    el.addEventListener('loadedmetadata', () => {
      // Drop in somewhere past the opening — openings are too recognisable —
      // muted until the seek lands so the jump is inaudible.
      const start =
        Number.isFinite(el.duration) && el.duration > CLIP_SEC * 3
          ? Math.min(el.duration * 0.3, el.duration - CLIP_SEC - 2)
          : 0
      clipStartRef.current = start
      if (start > 0) el.currentTime = start
      else el.muted = false
    })
    el.addEventListener('seeked', () => {
      el.muted = false
    })
    el.addEventListener('timeupdate', () => {
      const start = clipStartRef.current
      if (start === null) return
      const t = (el.currentTime - start) / CLIP_SEC
      setClipProgress(Math.min(1, Math.max(0, t)))
      if (t >= 1 && !el.paused) el.pause()
    })
    el.addEventListener('ended', () => setClipProgress(1))
    el.addEventListener('error', () => {
      if (el.error) clipErrorRef.current()
    })

    return () => {
      el.pause()
      el.removeAttribute('src')
      audioRef.current = null
    }
  }, [])

  if (loading) return <Spinner />
  if (error) return <ErrorMessage error={error} />
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

  function playClip(work: Work) {
    const el = audioRef.current
    if (!el) return
    const tracks = workTracks(work).filter((t) => clipUrl(t))
    const track = tracks[Math.floor(Math.random() * tracks.length)]
    // The main player must not compete with the quiz.
    const player = usePlayerStore.getState()
    if (player.isPlaying) player.togglePlay()

    setClipFailed(false)
    setClipProgress(0)
    clipStartRef.current = null
    el.muted = true
    el.volume = player.muted ? 0 : player.volume
    el.src = clipUrl(track)!
    el.play().catch(() => {
      // Superseded loads also reject their play() promise; only a load with a
      // real media error should trigger the spare-work swap.
      if (el.error) clipErrorRef.current()
    })
  }

  /** A clip that won't load gets its work swapped out for a spare. */
  function handleClipError() {
    if (answeredRef.current || phase !== 'round') return
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
  clipErrorRef.current = handleClipError

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
    audioRef.current?.pause()
  }

  function nextRound() {
    if (roundNo + 1 >= rounds.length) {
      setPhase('done')
      audioRef.current?.pause()
      return
    }
    setPicked(null)
    setRoundNo((n) => n + 1)
    playClip(rounds[roundNo + 1].work)
  }

  function replay() {
    const el = audioRef.current
    if (!el || clipStartRef.current === null) return
    el.currentTime = clipStartRef.current
    setClipProgress(0)
    void el.play().catch(() => {})
  }

  if (phase === 'intro') {
    return (
      <div className="mx-auto max-w-xl py-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
          Guess the composer
        </p>
        <h1 className="mt-2 text-3xl font-extrabold md:text-4xl">Test your ear</h1>
        <p className="mt-3 text-sm text-zinc-400">
          {ROUNDS} blind clips from the catalog, {CLIP_SEC} seconds each, four
          composers to choose from. No titles, no artwork — just the music.
        </p>
        <button
          type="button"
          onClick={start}
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-8 py-3 text-sm font-bold text-black transition-colors hover:bg-accent-hover"
        >
          <PlayIcon width="16" height="16" />
          Start quiz
        </button>
      </div>
    )
  }

  if (phase === 'done') {
    const verdict =
      score === ROUNDS
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
          {score} / {rounds.length}
        </h1>
        <p className="mt-3 text-sm text-zinc-400">{verdict}</p>
        <div className="mt-8 flex justify-center gap-3">
          <button
            type="button"
            onClick={start}
            className="rounded-full bg-accent px-6 py-2.5 text-sm font-bold text-black transition-colors hover:bg-accent-hover"
          >
            Play again
          </button>
          <Link
            to="/composers"
            className="rounded-full border border-zinc-600 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:border-white"
          >
            Browse composers
          </Link>
        </div>
      </div>
    )
  }

  const round = rounds[roundNo]
  const correctSlug = round.work.composerSlug!

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-xl font-bold">
          Round {roundNo + 1} <span className="text-zinc-500">of {rounds.length}</span>
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
            <button
              type="button"
              onClick={replay}
              aria-label="Replay clip"
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-black transition-transform hover:scale-105"
            >
              <PlayIcon width="18" height="18" className="translate-x-px" />
            </button>
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
            <Link to={`/work/${round.work.id}`} className="font-semibold hover:underline">
              {round.work.title}
            </Link>{' '}
            by {round.work.composerName}.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {round.choices.map((c) => {
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
              onClick={() => answer(c.slug)}
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
            onClick={nextRound}
            className="rounded-full bg-white px-6 py-2.5 text-sm font-bold text-black transition-colors hover:bg-zinc-200"
          >
            {roundNo + 1 >= rounds.length ? 'See results' : 'Next round'}
          </button>
        </div>
      )}
    </div>
  )
}
