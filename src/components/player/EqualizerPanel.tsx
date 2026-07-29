import { useEffect, useRef, useState } from 'react'
import { useBackDismiss } from '../../hooks/useBackDismiss'
import { isIOS } from '../../lib/platform'
import {
  EQ_BAND_LABELS,
  EQ_GAIN_RANGE,
  disableFx,
  enableFx,
  getAnalyser,
  isFxEnabled,
  loadGains,
  resetGains,
  setBandGain,
} from '../../player/audioFx'
import { SlidersIcon } from '../common/icons'

function Visualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let raf = 0
    const render = () => {
      raf = requestAnimationFrame(render)
      const canvas = canvasRef.current
      const c = canvas?.getContext('2d')
      if (!canvas || !c) return
      c.clearRect(0, 0, canvas.width, canvas.height)
      const analyser = getAnalyser()
      if (!analyser) return
      const data = new Uint8Array(analyser.frequencyBinCount)
      analyser.getByteFrequencyData(data)
      const bars = 32
      const step = Math.floor(data.length / bars)
      const barWidth = canvas.width / bars
      c.fillStyle = '#1db954'
      for (let i = 0; i < bars; i++) {
        const v = data[i * step] / 255
        const h = Math.max(2, v * canvas.height)
        c.fillRect(i * barWidth + 1, canvas.height - h, barWidth - 2, h)
      }
    }
    render()
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      width={264}
      height={56}
      className="mb-3 h-14 w-full rounded bg-zinc-900"
      aria-hidden="true"
    />
  )
}

export default function EqualizerPanel() {
  const [open, setOpen] = useState(false)
  // A mobile back swipe closes the panel while it's open.
  useBackDismiss(() => setOpen(false), open)
  const [enabled, setEnabled] = useState(isFxEnabled)
  const [gains, setGains] = useState(loadGains)
  const [enabling, setEnabling] = useState(false)

  async function handleEnable() {
    setEnabling(true)
    try {
      await enableFx()
      setEnabled(true)
      setGains(loadGains())
    } finally {
      setEnabling(false)
    }
  }

  function handleDisable() {
    disableFx()
    setEnabled(false)
    setGains(loadGains())
  }

  function handleGain(index: number, value: number) {
    setBandGain(index, value)
    setGains((g) => g.map((v, i) => (i === index ? value : v)))
  }

  return (
    <span className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Equalizer"
        aria-expanded={open}
        className={enabled ? 'text-accent' : 'text-zinc-400 hover:text-white'}
      >
        <SlidersIcon width="18" height="18" />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close equalizer"
            className="fixed inset-0 z-30 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute bottom-full right-0 z-40 mb-2 w-72 rounded-md border border-zinc-700 bg-zinc-800 p-4 shadow-xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Equalizer
            </p>

            {isIOS && (
              <p className="mb-3 rounded bg-amber-950/40 p-2 text-[11px] leading-snug text-amber-300">
                On iOS the equalizer routes audio through Web Audio, which can
                interrupt playback when the app is backgrounded or the screen
                locks. Leave it off for lock-screen listening.
              </p>
            )}

            {!enabled ? (
              <>
                <p className="mb-3 text-sm text-zinc-300">
                  Shape the sound with a 5-band equalizer and live spectrum
                  visualizer.
                </p>
                <button
                  type="button"
                  onClick={() => void handleEnable()}
                  disabled={enabling}
                  className="w-full rounded-full bg-accent px-4 py-2 text-sm font-bold text-black transition-colors hover:bg-accent-hover disabled:opacity-50"
                >
                  {enabling ? 'Enabling…' : 'Enable equalizer'}
                </button>
              </>
            ) : (
              <>
                <Visualizer />
                {EQ_BAND_LABELS.map((label, i) => (
                  <div key={label} className="mb-1.5 flex items-center gap-2">
                    <span className="w-8 text-right text-[11px] tabular-nums text-zinc-400">
                      {label}
                    </span>
                    <input
                      type="range"
                      min={-EQ_GAIN_RANGE}
                      max={EQ_GAIN_RANGE}
                      step={1}
                      value={gains[i]}
                      aria-label={`${label} Hz gain`}
                      onChange={(e) => handleGain(i, Number(e.target.value))}
                      className="h-1 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-zinc-600 accent-accent"
                    />
                    <span className="w-9 text-[11px] tabular-nums text-zinc-400">
                      {gains[i] > 0 ? `+${gains[i]}` : gains[i]} dB
                    </span>
                  </div>
                ))}
                <div className="mt-3 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      resetGains()
                      setGains(loadGains())
                    }}
                    className="text-xs text-zinc-400 hover:text-white"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={handleDisable}
                    className="text-xs text-red-300 hover:text-red-200"
                  >
                    Turn off
                  </button>
                </div>
                <p className="mt-3 text-[11px] leading-snug text-zinc-500">
                  Radio streams bypass the equalizer.
                </p>
              </>
            )}
          </div>
        </>
      )}
    </span>
  )
}
