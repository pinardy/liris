// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import {
  crossfadeSec,
  getMainElements,
  setCrossfadeSec,
  setPlaybackRate,
  setSleepFade,
  setVolume,
} from './audioEngine'
import { usePlayerStore } from './playerStore'

// Element-level behavior of the real engine module against jsdom's media
// elements: what actually lands on el.volume / el.playbackRate is exactly
// what the browser will play with.

describe('setPlaybackRate', () => {
  it('applies rate, default rate and pitch mode to BOTH gapless elements', () => {
    setPlaybackRate(0.7, true)
    for (const el of getMainElements()) {
      expect(el.playbackRate).toBe(0.7)
      // Loading a new src resets playbackRate to the default — the default
      // must carry the speed or every track change would snap back to 1×.
      expect(el.defaultPlaybackRate).toBe(0.7)
      expect(el.preservesPitch).toBe(true)
    }
  })

  it('turntable mode switches pitch preservation off on both elements', () => {
    setPlaybackRate(0.944, false)
    for (const el of getMainElements()) {
      expect(el.preservesPitch).toBe(false)
      expect(el.playbackRate).toBeCloseTo(0.944)
    }
    setPlaybackRate(1, true)
  })
})

describe('volume and sleep fade', () => {
  it('element volume is the user volume scaled by the fade factor', () => {
    setSleepFade(1)
    // Through the store on purpose: fade changes re-derive volume from store
    // state, so a direct engine call would be testing an impossible flow.
    usePlayerStore.getState().setVolume(0.8)
    for (const el of getMainElements()) expect(el.volume).toBeCloseTo(0.8)

    setSleepFade(0.5)
    for (const el of getMainElements()) expect(el.volume).toBeCloseTo(0.4)

    // Restoring the fade restores full user volume — a resume after a sleep
    // timer must not be silent.
    setSleepFade(1)
    for (const el of getMainElements()) expect(el.volume).toBeCloseTo(0.8)
  })

  it('clamps the fade factor into [0, 1]', () => {
    usePlayerStore.getState().setVolume(1)
    setSleepFade(-3)
    for (const el of getMainElements()) expect(el.volume).toBe(0)
    setSleepFade(7)
    for (const el of getMainElements()) expect(el.volume).toBe(1)
  })

  it('mute wins regardless of fade', () => {
    setSleepFade(1)
    setVolume(0.9, true)
    for (const el of getMainElements()) expect(el.muted).toBe(true)
    setVolume(0.9, false)
  })
})

describe('crossfade setting', () => {
  it('clamps to the supported range and rounds', () => {
    setCrossfadeSec(99)
    expect(crossfadeSec()).toBe(12)
    setCrossfadeSec(-5)
    expect(crossfadeSec()).toBe(0)
    setCrossfadeSec(6.6)
    expect(crossfadeSec()).toBe(7)
  })

  it('treats garbage in localStorage as off', () => {
    localStorage.setItem('player-crossfade', 'banana')
    expect(crossfadeSec()).toBe(0)
  })
})
