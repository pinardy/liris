import { describe, expect, it } from 'vitest'
import { classifySwipe } from './useSwipe'

/** Swipe from (x1,y1) to (x2,y2), taking `ms`. */
function swipe(x1: number, y1: number, x2: number, y2: number, ms = 120) {
  return classifySwipe({ x: x1, y: y1, t: 0 }, { x: x2, y: y2, t: ms })
}

describe('classifySwipe', () => {
  it('reads decisive horizontal flicks', () => {
    expect(swipe(200, 100, 100, 105)).toBe('left')
    expect(swipe(100, 100, 220, 95)).toBe('right')
  })

  it('reads upward flicks but leaves downward to page scroll', () => {
    expect(swipe(100, 300, 105, 200)).toBe('up')
    expect(swipe(100, 200, 105, 300)).toBeNull()
  })

  it('ignores taps and travel under the threshold', () => {
    expect(swipe(100, 100, 100, 100)).toBeNull()
    expect(swipe(100, 100, 130, 100)).toBeNull() // 30px
    expect(swipe(100, 100, 146, 100)).toBe('right') // 46px clears it
  })

  it('ignores diagonals, so an angled scroll never skips a track', () => {
    // 80 across, 70 down: neither axis dominates 2:1.
    expect(swipe(200, 100, 120, 170)).toBeNull()
  })

  it('ignores slow drags, which are scrolls rather than flicks', () => {
    expect(swipe(200, 100, 100, 100, 2000)).toBeNull()
    expect(swipe(200, 100, 100, 100, 700)).toBe('left')
  })
})
