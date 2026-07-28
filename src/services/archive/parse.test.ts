import { describe, expect, it } from 'vitest'
import { parseFile } from './parse'

describe('musopen parser', () => {
  it('parses composer, number, work and movement', () => {
    const parsed = parseFile('musopen', {
      name: 'x.mp3',
      title: 'Beethoven - 01 - Symphony No. 5, Op. 67 - I. Allegro con brio',
      creator: 'Musopen Symphony; John Doe',
    })
    expect(parsed).toEqual({
      composerRaw: 'Beethoven',
      workTitle: 'Symphony No. 5, Op. 67',
      movementNo: 1,
      movementTitle: 'I. Allegro con brio',
      performers: ['Musopen Symphony', 'John Doe'],
    })
  })

  it('handles work-only titles', () => {
    const parsed = parseFile('musopen', {
      name: 'x.mp3',
      title: 'Chopin - Nocturne in E flat, Op. 9 No. 2',
    })
    expect(parsed?.workTitle).toBe('Nocturne in E flat, Op. 9 No. 2')
    expect(parsed?.movementTitle).toBeUndefined()
  })

  it('falls back to the filename when the title is empty', () => {
    const parsed = parseFile('musopen', {
      name: 'folder/Mozart - Requiem.mp3',
    })
    expect(parsed?.composerRaw).toBe('Mozart')
    expect(parsed?.workTitle).toBe('Requiem')
  })

  it('rejects unstructured names', () => {
    expect(parseFile('musopen', { name: 'track01.mp3' })).toBeNull()
  })
})

describe('chopin parser', () => {
  it('attributes everything to Chopin and tidies the opus separator', () => {
    const parsed = parseFile('chopin', {
      name: 'x.mp3',
      title: 'Ballade no. 3 - Op. 47',
    })
    expect(parsed?.composerRaw).toBe('Chopin')
    expect(parsed?.workTitle).toBe('Ballade no. 3, Op. 47')
  })
})

describe('goldberg parser', () => {
  it('reads the playback ordinal (not the variation number) from the filename', () => {
    const parsed = parseFile('goldberg', {
      name: 'Goldberg Variations 05 Variatio 4.flac',
      title: 'Variatio 4 a 1 Clav.',
      creator: 'Kimiko Ishizaka',
    })
    expect(parsed?.composerRaw).toBe('Bach')
    expect(parsed?.workTitle).toBe('Goldberg Variations, BWV 988')
    // 05 is the file's position in the set (the Aria is track 1), which is
    // what ordering needs — Variatio 4 sits at position 5.
    expect(parsed?.movementNo).toBe(5)
    expect(parsed?.movementTitle).toBe('Variatio 4 a 1 Clav.')
    expect(parsed?.performers).toEqual(['Kimiko Ishizaka'])
  })
})

describe('masterpieces parser', () => {
  it('strips the year and the repeated composer prefix', () => {
    const parsed = parseFile('masterpieces', {
      name: '1810 Beethoven - Fur Elise.mp3',
      title: 'Beethoven: Fur Elise',
    })
    expect(parsed?.composerRaw).toBe('Ludwig van Beethoven')
    expect(parsed?.workTitle).toBe('Fur Elise')
  })

  it('resolves curated unattributed works', () => {
    const parsed = parseFile('masterpieces', {
      name: '1787 Eine kleine Nachtmusik.mp3',
      title: 'Eine kleine Nachtmusik',
    })
    expect(parsed?.composerRaw).toBe('Mozart')
  })

  it('splits a movement suffix from the work', () => {
    const parsed = parseFile('masterpieces', {
      name: '1808 Beethoven - Symphony No. 5, 1st movement.mp3',
      title: 'Beethoven - Symphony No. 5, 1st movement',
    })
    expect(parsed?.workTitle).toBe('Symphony No. 5')
    expect(parsed?.movementTitle).toBe('1st movement')
  })

  it('rejects works it cannot attribute', () => {
    expect(
      parseFile('masterpieces', {
        name: '1900 Mystery Piece.mp3',
        title: 'Mystery Piece',
      }),
    ).toBeNull()
  })
})
