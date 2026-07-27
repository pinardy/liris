/**
 * Web Audio equalizer + analyser for the main playback element.
 * The graph is created lazily (inside a user gesture) and, once created, is
 * permanent for the element — "off" therefore means flat gains, and the
 * enabled flag controls whether future sessions attach the graph at all.
 *
 * Requires CORS audio (crossOrigin='anonymous'); both Jamendo storage and
 * archive.org send the needed headers (verified). Radio streams don't, which
 * is why the engine plays them on a separate, un-graphed element.
 */

const ENABLED_KEY = 'audio-fx-enabled'
const GAINS_KEY = 'eq-gains'

export const EQ_BANDS = [60, 250, 1000, 4000, 12000]
export const EQ_BAND_LABELS = ['60', '250', '1k', '4k', '12k']
export const EQ_GAIN_RANGE = 12

let ctx: AudioContext | null = null
let filters: BiquadFilterNode[] = []
let analyser: AnalyserNode | null = null

export function isFxEnabled(): boolean {
  return localStorage.getItem(ENABLED_KEY) === '1'
}

export function loadGains(): number[] {
  try {
    const raw = JSON.parse(localStorage.getItem(GAINS_KEY) ?? '[]') as unknown
    if (Array.isArray(raw) && raw.length === EQ_BANDS.length) {
      return raw.map((v) =>
        Math.max(-EQ_GAIN_RANGE, Math.min(EQ_GAIN_RANGE, Number(v) || 0)),
      )
    }
  } catch {
    // fall through to flat
  }
  return EQ_BANDS.map(() => 0)
}

export function ensureGraph(el: HTMLAudioElement): void {
  if (ctx) return
  ctx = new AudioContext()
  const source = ctx.createMediaElementSource(el)
  const gains = loadGains()
  filters = EQ_BANDS.map((freq, i) => {
    const f = ctx!.createBiquadFilter()
    f.type = i === 0 ? 'lowshelf' : i === EQ_BANDS.length - 1 ? 'highshelf' : 'peaking'
    f.frequency.value = freq
    if (f.type === 'peaking') f.Q.value = 1
    f.gain.value = gains[i]
    return f
  })
  analyser = ctx.createAnalyser()
  analyser.fftSize = 256
  analyser.smoothingTimeConstant = 0.8
  const chain: AudioNode[] = [source, ...filters, analyser, ctx.destination]
  for (let i = 0; i < chain.length - 1; i++) chain[i].connect(chain[i + 1])
}

export function resumeContext(): void {
  // Resuming outside a user gesture can reject on some browsers — harmless,
  // the next play() attempt retries.
  if (ctx?.state === 'suspended') ctx.resume().catch(() => {})
}

export function getAnalyser(): AnalyserNode | null {
  return analyser
}

export function setBandGain(index: number, db: number): void {
  const clamped = Math.max(-EQ_GAIN_RANGE, Math.min(EQ_GAIN_RANGE, db))
  const gains = loadGains()
  gains[index] = clamped
  localStorage.setItem(GAINS_KEY, JSON.stringify(gains))
  const filter = filters[index]
  if (filter && ctx) {
    filter.gain.setTargetAtTime(clamped, ctx.currentTime, 0.05)
  }
}

export function resetGains(): void {
  EQ_BANDS.forEach((_, i) => setBandGain(i, 0))
}

/** Turn the equalizer on: mark enabled, switch the element to CORS loading,
 *  build the graph and reload the current track so it picks up the new mode. */
export async function enableFx(): Promise<void> {
  localStorage.setItem(ENABLED_KEY, '1')
  const engine = await import('./audioEngine')
  const el = engine.getMainElement()
  el.crossOrigin = 'anonymous'
  ensureGraph(el)
  resumeContext()
  await engine.reloadCurrentTrack()
}

/** Flatten gains and stop attaching the graph in future sessions. (The graph
 *  can't be detached from the element within this session.) */
export function disableFx(): void {
  localStorage.removeItem(ENABLED_KEY)
  resetGains()
}
