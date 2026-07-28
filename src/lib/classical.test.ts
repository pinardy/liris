import { describe, expect, it } from 'vitest'
import type { Track } from '../types/model'
import {
  detectCatalogue,
  detectForm,
  isSameWork,
  normalizeWorkTitle,
  slugify,
  workIdForTrack,
} from './classical'

describe('detectCatalogue', () => {
  it('finds opus numbers', () => {
    expect(detectCatalogue('Symphony No. 3 in E flat, Op. 55')).toBe('Op. 55')
  })

  it('normalizes a missing space after the dot', () => {
    expect(detectCatalogue('Nocturne Op.9 No. 2')).toBe('Op. 9')
  })

  it('finds BWV numbers', () => {
    expect(detectCatalogue('Goldberg Variations, BWV 988')).toBe('BWV 988')
  })

  it('finds Köchel numbers', () => {
    expect(detectCatalogue('Piano Concerto No. 21 in C, K. 467')).toBe('K. 467')
  })

  it('finds Deutsch numbers', () => {
    expect(detectCatalogue('Piano Sonata in B flat, D. 960')).toBe('D. 960')
  })

  it('finds Hoboken numbers', () => {
    expect(detectCatalogue('Symphony in G, Hob. I: 94')).toBe('Hob. I: 94')
  })

  it('returns undefined when there is none', () => {
    expect(detectCatalogue('Eine kleine Nachtmusik')).toBeUndefined()
  })
})

describe('detectForm', () => {
  it('detects symphonies', () => {
    expect(detectForm('Symphony No. 5')?.slug).toBe('symphony')
  })

  it('detects Brandenburg as a concerto', () => {
    expect(detectForm('Brandenburg Concerto No. 3')?.slug).toBe('concerto')
  })

  it('classifies a piano concerto as concerto, not piano piece', () => {
    expect(detectForm('Piano Concerto No. 1')?.slug).toBe('concerto')
  })

  it('detects chamber music', () => {
    expect(detectForm('String Quartet No. 14')?.slug).toBe('chamber')
  })

  it('detects nocturnes as piano pieces', () => {
    expect(detectForm('Nocturne in E flat')?.slug).toBe('piano-pieces')
  })
})

describe('normalizeWorkTitle', () => {
  it('strips trailing movement markers', () => {
    expect(normalizeWorkTitle('Symphony No. 5 - 1st movement')).toBe('Symphony No. 5')
  })

  it('strips parenthesised movement notes', () => {
    expect(normalizeWorkTitle('Moonlight Sonata (first movement)')).toBe(
      'Moonlight Sonata',
    )
  })

  it('strips numbered variation markers', () => {
    expect(normalizeWorkTitle('Goldberg Variations - Var. 12')).toBe(
      'Goldberg Variations',
    )
  })

  it('repairs known source typos', () => {
    expect(normalizeWorkTitle('Symphon No. 9')).toBe('Symphony No. 9')
  })

  it('collapses whitespace', () => {
    expect(normalizeWorkTitle('  Prelude   in C  ')).toBe('Prelude in C')
  })
})

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Goldberg Variations, BWV 988')).toBe('goldberg-variations-bwv-988')
  })

  it('strips diacritics', () => {
    expect(slugify('Antonín Dvořák')).toBe('antonin-dvorak')
  })
})

function track(over: Partial<Track>): Track {
  return {
    id: 't',
    source: 'archive',
    title: 'I. Allegro',
    artist: 'Composer',
    durationSec: 60,
    addedAt: 0,
    ...over,
  }
}

describe('isSameWork', () => {
  it('groups movements sharing album and artist', () => {
    const a = track({ album: 'Symphony No. 5', title: 'I. Allegro' })
    const b = track({ album: 'Symphony No. 5', title: 'II. Andante' })
    expect(isSameWork(a, b)).toBe(true)
  })

  it('separates different works', () => {
    const a = track({ album: 'Symphony No. 5' })
    const b = track({ album: 'Symphony No. 6' })
    expect(isSameWork(a, b)).toBe(false)
  })

  it('separates the same title by different composers', () => {
    const a = track({ album: 'Requiem', artist: 'Mozart' })
    const b = track({ album: 'Requiem', artist: 'Verdi' })
    expect(isSameWork(a, b)).toBe(false)
  })

  it('never groups tracks without an album', () => {
    const a = track({ album: undefined })
    expect(isSameWork(a, a)).toBe(false)
  })
})

describe('workIdForTrack', () => {
  it('mirrors the catalog id scheme', () => {
    const t = track({
      artist: 'Johann Sebastian Bach',
      album: 'Goldberg Variations, BWV 988',
    })
    expect(workIdForTrack(t)).toBe('bach--goldberg-variations-bwv-988')
  })

  it('slugifies unknown composers', () => {
    const t = track({ artist: 'Unknown Person', album: 'Some Work' })
    expect(workIdForTrack(t)).toBe('unknown-person--some-work')
  })

  it('returns undefined for non-archive tracks', () => {
    expect(workIdForTrack(track({ source: 'local', album: 'X' }))).toBeUndefined()
  })
})
