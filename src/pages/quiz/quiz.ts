import { formBySlug, workTracks, type Work } from '../../lib/classical'
import { composerBySlug, periods, type Composer } from '../../lib/composers'
import { shuffled } from '../../player/queue'
import type { Track } from '../../types/model'

export const ROUNDS = 10

export type QuizMode = 'composer' | 'period' | 'form'
export type Difficulty = 'easy' | 'medium' | 'hard'

export const MODES: { id: QuizMode; label: string; question: string }[] = [
  { id: 'composer', label: 'Composer', question: 'Who wrote it?' },
  { id: 'period', label: 'Period', question: 'Which period?' },
  { id: 'form', label: 'Form', question: 'Which form?' },
]

export interface DifficultyDef {
  id: Difficulty
  label: string
  /** Number of answer buttons. */
  choices: number
  /** Clip length in seconds — shorter is harder. */
  clipSec: number
  /** Composer mode only: prefer same-period decoys (a music question, not a
   *  dates one). Off on easy for a gentler start. */
  affinity: boolean
}

export const DIFFICULTIES: DifficultyDef[] = [
  { id: 'easy', label: 'Easy', choices: 3, clipSec: 30, affinity: false },
  { id: 'medium', label: 'Medium', choices: 4, clipSec: 20, affinity: true },
  { id: 'hard', label: 'Hard', choices: 6, clipSec: 12, affinity: true },
]

export function difficultyDef(id: Difficulty): DifficultyDef {
  return DIFFICULTIES.find((d) => d.id === id) ?? DIFFICULTIES[1]
}

/** One selectable answer, rendered generically by QuizRound. */
export interface Choice {
  key: string
  label: string
  sublabel?: string
  /** Composer slug — when set, the choice renders with a portrait. */
  avatarSlug?: string
}

export interface Round {
  work: Work
  choices: Choice[]
  /** The correct choice key. */
  answer: string
}

export function clipUrl(track: Track): string | undefined {
  return track.archive?.audioUrl ?? track.jamendo?.audioUrl
}

function hasClip(work: Work): boolean {
  return workTracks(work).some((t) => clipUrl(t))
}

/** The correct answer key for a work under a mode, or undefined if the work
 *  can't be used for that mode. */
export function answerKey(mode: QuizMode, work: Work): string | undefined {
  if (mode === 'composer') {
    return work.composerSlug && composerBySlug(work.composerSlug)
      ? work.composerSlug
      : undefined
  }
  if (mode === 'period') return work.period || undefined
  return work.formSlug || undefined
}

export function isEligible(mode: QuizMode, work: Work): boolean {
  return answerKey(mode, work) !== undefined && hasClip(work)
}

/** Human-readable label for a correct answer, for the reveal line. */
export function keyLabel(mode: QuizMode, key: string): string {
  if (mode === 'composer') return composerBySlug(key)?.name ?? key
  if (mode === 'form') return formBySlug(key)?.label ?? key
  return key
}

function composerChoice(c: Composer): Choice {
  const dates = c.born ? ` · ${c.born}–${c.died ?? ''}` : ''
  return { key: c.slug, label: c.name, sublabel: `${c.period}${dates}`, avatarSlug: c.slug }
}

interface ChoiceContext {
  composers: Composer[]
  /** The eligible works of the current game — the pool of plausible answers. */
  works: Work[]
}

/** Correct answer plus decoys, in random order. Decoys come from answers that
 *  actually occur in the catalog so every option is plausible. */
export function buildChoices(
  mode: QuizMode,
  correctKey: string,
  count: number,
  affinity: boolean,
  ctx: ChoiceContext,
): Choice[] {
  if (mode === 'composer') {
    const correct = composerBySlug(correctKey)!
    const others = shuffled(ctx.composers.filter((c) => c.slug !== correct.slug))
    const ordered = affinity
      ? [
          ...others.filter((c) => c.period === correct.period),
          ...others.filter((c) => c.period !== correct.period),
        ]
      : others
    const decoys = ordered.slice(0, count - 1).map(composerChoice)
    return shuffled([composerChoice(correct), ...decoys])
  }

  if (mode === 'period') {
    const present = distinctDefined(ctx.works.map((w) => w.period))
    const pool = present.length >= count ? present : periods.map((p) => p.name)
    const decoys = shuffled(pool.filter((p) => p !== correctKey)).slice(0, count - 1)
    const toChoice = (name: string): Choice => ({
      key: name,
      label: name,
      sublabel: periods.find((p) => p.name === name)?.range,
    })
    return shuffled([toChoice(correctKey), ...decoys.map(toChoice)])
  }

  const present = distinctDefined(ctx.works.map((w) => w.formSlug))
  const decoys = shuffled(present.filter((f) => f !== correctKey)).slice(0, count - 1)
  const toChoice = (slug: string): Choice => ({
    key: slug,
    label: formBySlug(slug)?.label ?? slug,
  })
  return shuffled([toChoice(correctKey), ...decoys.map(toChoice)])
}

/** Distinct, non-empty values from a list that may contain undefined/null. */
function distinctDefined<T>(items: (T | undefined | null)[]): T[] {
  return [...new Set(items.filter((x): x is T => x != null))]
}
