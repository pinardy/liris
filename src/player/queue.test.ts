import { describe, expect, it } from 'vitest'
import type { Track } from '../types/model'
import { nextIndex, prevIndex, shuffleQueue, shuffled } from './queue'

function track(id: string): Track {
  return {
    id,
    source: 'archive',
    title: id,
    artist: 'Composer',
    durationSec: 60,
    addedAt: 0,
  }
}

describe('nextIndex', () => {
  it('advances through the queue', () => {
    expect(nextIndex(5, 2, 'off', true)).toBe(3)
  })

  it('stops at the end on auto-advance with repeat off', () => {
    expect(nextIndex(5, 4, 'off', true)).toBeNull()
  })

  it('wraps to the start on manual next at the end', () => {
    expect(nextIndex(5, 4, 'off', false)).toBe(0)
  })

  it('wraps on auto-advance with repeat all', () => {
    expect(nextIndex(5, 4, 'all', true)).toBe(0)
  })

  it('repeats the same track on auto-advance with repeat one', () => {
    expect(nextIndex(5, 2, 'one', true)).toBe(2)
  })

  it('lets manual next escape repeat one', () => {
    expect(nextIndex(5, 2, 'one', false)).toBe(3)
  })

  it('returns null for an empty queue', () => {
    expect(nextIndex(0, -1, 'all', true)).toBeNull()
  })
})

describe('prevIndex', () => {
  it('steps back', () => {
    expect(prevIndex(5, 3, 'off')).toBe(2)
  })

  it('stays at the start with repeat off', () => {
    expect(prevIndex(5, 0, 'off')).toBe(0)
  })

  it('wraps to the end with repeat all', () => {
    expect(prevIndex(5, 0, 'all')).toBe(4)
  })
})

describe('shuffleQueue', () => {
  const queue = ['a', 'b', 'c', 'd', 'e'].map(track)

  it('puts the current track first', () => {
    expect(shuffleQueue(queue, 2)[0].id).toBe('c')
  })

  it('keeps every track exactly once', () => {
    const ids = shuffleQueue(queue, 2)
      .map((t) => t.id)
      .sort()
    expect(ids).toEqual(['a', 'b', 'c', 'd', 'e'])
  })

  it('does not mutate the input', () => {
    const before = [...queue]
    shuffleQueue(queue, 0)
    expect(queue).toEqual(before)
  })
})

describe('shuffled', () => {
  it('preserves the multiset', () => {
    const input = [1, 2, 2, 3]
    expect([...shuffled(input)].sort()).toEqual([1, 2, 2, 3])
  })
})
