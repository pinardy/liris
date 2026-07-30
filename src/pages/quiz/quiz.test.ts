import { describe, expect, it } from 'vitest'
import type { Work } from '../../lib/classical'
import type { Composer } from '../../lib/composers'
import { answerKey, buildChoices, keyLabel } from './quiz'

function work(over: Partial<Work>): Work {
  return {
    id: over.title ?? 'w',
    title: 'Work',
    composerName: 'Composer',
    recordings: [],
    ...over,
  }
}

function composer(slug: string, period: Composer['period']): Composer {
  return { slug, name: slug, surname: slug, period, aliases: [] }
}

const works: Work[] = [
  work({ composerSlug: 'bach', period: 'Baroque', formSlug: 'concerto' }),
  work({ composerSlug: 'mozart', period: 'Classical', formSlug: 'symphony' }),
  work({ composerSlug: 'chopin', period: 'Romantic', formSlug: 'piano-pieces' }),
  work({ composerSlug: 'debussy', period: 'Modern', formSlug: 'chamber' }),
]

describe('answerKey', () => {
  it('reads the right field per mode', () => {
    const w = works[0]
    // 'bach' is a real catalog composer, so composer mode resolves it.
    expect(answerKey('composer', w)).toBe('bach')
    expect(answerKey('period', w)).toBe('Baroque')
    expect(answerKey('form', w)).toBe('concerto')
  })

  it('is undefined when the field is missing', () => {
    expect(answerKey('period', work({}))).toBeUndefined()
    expect(answerKey('form', work({}))).toBeUndefined()
  })
})

describe('buildChoices', () => {
  const composers = [
    composer('mozart', 'Classical'),
    composer('haydn', 'Classical'),
    composer('chopin', 'Romantic'),
    composer('debussy', 'Modern'),
  ]

  it('returns exactly `count` unique choices including the correct one', () => {
    const choices = buildChoices('composer', 'bach', 4, false, { composers, works })
    expect(choices).toHaveLength(4)
    expect(choices.some((c) => c.key === 'bach')).toBe(true)
    expect(new Set(choices.map((c) => c.key)).size).toBe(4)
    // Composer choices carry a portrait slug.
    expect(choices.every((c) => c.avatarSlug === c.key)).toBe(true)
  })

  it('period/form choices include the answer and carry no portrait', () => {
    const period = buildChoices('period', 'Baroque', 3, false, { composers, works })
    expect(period).toHaveLength(3)
    expect(period.some((c) => c.key === 'Baroque')).toBe(true)
    expect(period.every((c) => c.avatarSlug === undefined)).toBe(true)

    const form = buildChoices('form', 'concerto', 3, false, { composers, works })
    expect(form.some((c) => c.key === 'concerto')).toBe(true)
    expect(form.find((c) => c.key === 'concerto')?.label).toBe('Concertos')
  })

  it('prefers same-period decoys when affinity is on', () => {
    // Correct = bach (Baroque); with affinity off among period-diverse decoys
    // it can pick anyone, but with 2 choices and a same-period option present
    // affinity should surface it. Use a pool with one same-period composer.
    const pool = [composer('handel', 'Baroque'), composer('mozart', 'Classical')]
    const choices = buildChoices('composer', 'bach', 2, true, { composers: pool, works })
    const decoy = choices.find((c) => c.key !== 'bach')
    expect(decoy?.key).toBe('handel')
  })
})

describe('keyLabel', () => {
  it('labels forms and passes periods through', () => {
    expect(keyLabel('form', 'concerto')).toBe('Concertos')
    expect(keyLabel('period', 'Baroque')).toBe('Baroque')
  })
})
