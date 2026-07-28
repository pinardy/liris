import { describe, expect, it } from 'vitest'
import { classifyPerformer, detectInstruments } from './performers'

describe('classifyPerformer', () => {
  it('recognises orchestras', () => {
    expect(classifyPerformer('Czech National Symphony Orchestra')).toBe('orchestra')
    expect(classifyPerformer('Musopen Symphony')).toBe('orchestra')
    expect(classifyPerformer('Orchestre de la Suisse Romande')).toBe('orchestra')
  })

  it('recognises ensembles', () => {
    expect(classifyPerformer('Musopen String Quartet')).toBe('ensemble')
    expect(classifyPerformer('Academy of St Martin in the Fields')).toBe('ensemble')
  })

  it('prefers choir over orchestra for a symphony chorus', () => {
    expect(classifyPerformer('London Symphony Chorus')).toBe('choir')
  })

  it('defaults people to artist', () => {
    expect(classifyPerformer('Kimiko Ishizaka')).toBe('artist')
    expect(classifyPerformer('Paul Pitman')).toBe('artist')
  })
})

describe('detectInstruments', () => {
  it('finds the instrument named in a title', () => {
    expect(detectInstruments('Piano Concerto No. 21 in C')).toEqual(['piano'])
    expect(detectInstruments('Cello Suite No. 1')).toEqual(['cello'])
    expect(detectInstruments('Violin Sonata in A')).toEqual(['violin'])
  })

  it('does not read harpsichord as harp', () => {
    expect(detectInstruments('Harpsichord Concerto in D minor')).toEqual([
      'harpsichord',
    ])
  })

  it('finds several instruments', () => {
    expect(detectInstruments('Sonata for Flute and Piano')).toEqual(['piano', 'flute'])
  })

  it('returns nothing for orchestral titles', () => {
    expect(detectInstruments('Symphony No. 9 in D minor')).toEqual([])
  })
})
