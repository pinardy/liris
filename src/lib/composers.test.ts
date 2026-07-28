import { describe, expect, it } from 'vitest'
import { findComposer, fold, repairMojibake } from './composers'

describe('fold', () => {
  it('strips diacritics and case', () => {
    expect(fold('Antonín Dvořák')).toBe('antonin dvorak')
  })

  it('collapses whitespace', () => {
    expect(fold('  Johann   Sebastian  Bach ')).toBe('johann sebastian bach')
  })
})

describe('repairMojibake', () => {
  it('reverses UTF-8 read as Windows-1252', () => {
    // 'Dvořák' whose UTF-8 bytes were decoded as cp1252.
    expect(repairMojibake('DvoÅ™Ã¡k')).toBe('Dvořák')
  })

  it('leaves correctly encoded text alone', () => {
    expect(repairMojibake('Dvořák')).toBe('Dvořák')
    expect(repairMojibake('Bach')).toBe('Bach')
  })
})

describe('findComposer', () => {
  it('matches full names', () => {
    expect(findComposer('Johann Sebastian Bach')?.slug).toBe('bach')
  })

  it('matches initialed aliases', () => {
    expect(findComposer('J.S. Bach')?.slug).toBe('bach')
  })

  it('matches unaccented spellings', () => {
    expect(findComposer('Dvorak')?.slug).toBe('dvorak')
  })

  it('matches mojibake spellings', () => {
    expect(findComposer('DvoÅ™Ã¡k')?.slug).toBe('dvorak')
  })

  it('finds a composer embedded in a longer string', () => {
    expect(findComposer('Bach , Oboe Concerto in D minor')?.slug).toBe('bach')
  })

  it('does not confuse the two Strausses', () => {
    expect(findComposer('Johann Strauss II')?.slug).toBe('strauss-ii')
    expect(findComposer('Richard Strauss')?.slug).toBe('strauss-r')
  })

  it('returns undefined for unknown names', () => {
    expect(findComposer('John Williams')).toBeUndefined()
  })
})
