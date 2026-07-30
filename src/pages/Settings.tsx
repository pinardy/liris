import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import Button from '../components/common/Button'
import PageHeading from '../components/common/PageHeading'
import { DownloadIcon } from '../components/common/icons'
import { formatBytes } from '../lib/format'
import { toast } from '../lib/toast'
import { crossfadeSec, setCrossfadeSec } from '../player/audioEngine'
import { exportBackup, importBackup } from '../services/db/backup'
import { clearListeningData } from '../services/db/recents'

export default function Settings() {
  const [crossfade, setCrossfade] = useState(crossfadeSec)
  const [usage, setUsage] = useState<string>()
  const importInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    void navigator.storage?.estimate?.().then((est) => {
      if (est.usage != null) setUsage(formatBytes(est.usage))
    })
  }, [])

  function handleCrossfade(secs: number) {
    setCrossfade(secs)
    setCrossfadeSec(secs)
  }

  async function handleExport() {
    const blob = await exportBackup()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `liris-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast('Backup downloaded')
  }

  async function handleImport(file: File) {
    try {
      const r = await importBackup(file)
      toast(
        `Restored ${r.playlists} playlist${r.playlists === 1 ? '' : 's'} and ` +
          `${r.favorites} favorite${r.favorites === 1 ? '' : 's'}`,
      )
    } catch (err) {
      console.error('Backup import failed', err)
      toast('Could not import — not a valid Liris backup')
    }
  }

  async function handleClearHistory() {
    if (!confirm('Clear all listening history and stats? This cannot be undone.')) return
    await clearListeningData()
    toast('Listening history cleared')
  }

  return (
    <>
      <PageHeading title="Settings" />

      <div className="max-w-2xl space-y-8">
        <section>
          <h2 className="mb-3 text-lg font-bold">Playback</h2>
          <div className="rounded-lg bg-zinc-900/60 p-4">
            <div className="mb-1 flex items-center justify-between">
              <label htmlFor="crossfade" className="text-sm font-medium">
                Crossfade
              </label>
              <span className="text-xs tabular-nums text-zinc-400">
                {crossfade === 0 ? 'Off' : `${crossfade}s`}
              </span>
            </div>
            <input
              id="crossfade"
              type="range"
              min={0}
              max={12}
              step={3}
              value={crossfade}
              onChange={(e) => handleCrossfade(Number(e.target.value))}
              className="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-600 accent-accent"
            />
            <p className="mt-2 text-xs text-zinc-500">
              Blends one track into the next when they belong to different works.
              Movements of a single work always segue gaplessly.
            </p>
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            The equalizer and sleep timer live in the player bar while music is
            playing.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold">Backup &amp; restore</h2>
          <div className="rounded-lg bg-zinc-900/60 p-4">
            <p className="mb-4 text-sm text-zinc-400">
              Your playlists, smart playlists and favorites live only in this
              browser. Export a backup to keep them safe or move them to another
              device. Imported backups merge in — nothing is deleted. Local audio
              files aren't included.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => void handleExport()}>
                <DownloadIcon width="16" height="16" />
                Export backup
              </Button>
              <Button
                variant="subtle"
                size="sm"
                onClick={() => importInput.current?.click()}
              >
                Import backup
              </Button>
              <input
                ref={importInput}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void handleImport(file)
                  e.target.value = ''
                }}
              />
            </div>
            {usage && (
              <p className="mt-4 text-xs text-zinc-500">
                {usage} stored on this device ·{' '}
                <Link to="/downloads" className="underline-offset-2 hover:text-white hover:underline">
                  manage downloads
                </Link>
              </p>
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold">Listening data</h2>
          <div className="rounded-lg border border-red-900/40 bg-red-950/20 p-4">
            <p className="mb-3 text-sm text-zinc-400">
              Clear your play history and the stats built from it. Your playlists
              and favorites are untouched.
            </p>
            <button
              type="button"
              onClick={() => void handleClearHistory()}
              className="rounded-full border border-red-900/60 px-4 py-2 text-sm font-medium text-red-300 transition-colors hover:border-red-700 hover:text-red-200"
            >
              Clear listening history
            </button>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold">About</h2>
          <p className="text-sm text-zinc-400">
            Liris Classical is a free player for the classical canon, built on
            public-domain recordings from the Internet Archive and Creative
            Commons tracks from Jamendo. Everything you save stays on your device.
          </p>
          <p className="mt-3 text-sm">
            <a
              href="https://github.com/pinardy/liris"
              target="_blank"
              rel="noreferrer"
              className="text-zinc-400 underline-offset-2 hover:text-white hover:underline"
            >
              Source on GitHub ↗
            </a>
          </p>
        </section>
      </div>
    </>
  )
}
