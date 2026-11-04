import { describe, expect, it } from 'vitest'
import type { Work } from './classical'
import { sungTextFor } from './libretti'

function work(title: string, composerSlug?: string, formSlug?: string): Work {
  return {
    id: `${composerSlug ?? 'x'}--${title}`,
    title,
    composerName: composerSlug ?? 'Someone',
    composerSlug,
    formSlug,
    recordings: [],
  }
}

function query(url: string | undefined): string | null {
  return url ? new URL(url).searchParams.get('search') : null
}

describe('sungTextFor', () => {
  it('gives instrumental works nothing', () => {
    expect(sungTextFor(work('Symphony No. 5 in C minor, Op. 67', 'beethoven'))).toBeUndefined()
    expect(sungTextFor(work('Goldberg Variations, BWV 988', 'bach'))).toBeUndefined()
  })

  it('points liturgical settings at the shared Latin text, whoever set it', () => {
    for (const slug of ['mozart', 'verdi']) {
      const text = sungTextFor(work('Requiem in D minor', slug))
      expect(text?.label).toBe('Latin text')
      expect(query(text?.url)).toContain('Requiem')
    }
    expect(query(sungTextFor(work('Mass in B minor, BWV 232', 'bach'))?.url)).toContain('Kyrie')
  })

  it('names famous operas in their original language', () => {
    expect(query(sungTextFor(work('The Marriage of Figaro', 'mozart'))?.url)).toContain('nozze')
    expect(query(sungTextFor(work('The Magic Flute, K. 620', 'mozart'))?.url)).toContain('Zauberflöte')
  })

  it("links Beethoven's Ninth to Schiller, but not other ninth symphonies", () => {
    expect(sungTextFor(work('Symphony No. 9 in D minor, Op. 125', 'beethoven'))?.label).toBe(
      'Ode to Joy text',
    )
    expect(sungTextFor(work('Symphony No. 9 in E minor, Op. 95', 'dvorak'))).toBeUndefined()
  })

  it('falls back to a generic libretto search for other sung works', () => {
    const text = sungTextFor(work('Cantata BWV 140', 'bach', 'vocal'))
    expect(text?.label).toBe('Libretto')
    expect(query(text?.url)).toBe('Cantata BWV 140 Bach libretto')
  })
})
