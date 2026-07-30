import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import PageHeading from '../components/common/PageHeading'
import { EmptyState } from '../components/common/Status'
import { PlusIcon, SearchIcon } from '../components/common/icons'
import TrackActions from '../components/tracks/TrackActions'
import TrackList from '../components/tracks/TrackList'
import { formatBytes } from '../lib/format'
import { usePlayerStore } from '../player/playerStore'
import { deleteLocalTrack, getLocalTracks } from '../services/db/library'
import {
  importFiles,
  type ImportProgress,
  type ImportResult,
} from '../services/localImport/importFiles'
import type { Track } from '../types/model'

type SortKey = 'recent' | 'title' | 'artist' | 'album'

const SORT_LABELS: Record<SortKey, string> = {
  recent: 'Recently added',
  title: 'Title',
  artist: 'Artist',
  album: 'Album',
}

export default function Library() {
  const tracks = useLiveQuery(getLocalTracks, [])
  const playQueue = usePlayerStore((s) => s.playQueue)

  const fileInput = useRef<HTMLInputElement>(null)
  const folderInput = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState<ImportProgress | null>(null)
  const [lastResult, setLastResult] = useState<ImportResult | null>(null)
  const [usage, setUsage] = useState<string>()
  const [filter, setFilter] = useState('')
  const [sort, setSort] = useState<SortKey>('recent')

  const visibleTracks = useMemo(() => {
    if (!tracks) return undefined
    const q = filter.trim().toLowerCase()
    const list = q
      ? tracks.filter(
          (t) =>
            t.title.toLowerCase().includes(q) ||
            t.artist.toLowerCase().includes(q) ||
            (t.album ?? '').toLowerCase().includes(q),
        )
      : [...tracks]
    switch (sort) {
      case 'recent':
        list.sort((a, b) => b.addedAt - a.addedAt)
        break
      case 'title':
        list.sort((a, b) => a.title.localeCompare(b.title))
        break
      case 'artist':
        list.sort(
          (a, b) => a.artist.localeCompare(b.artist) || a.title.localeCompare(b.title),
        )
        break
      case 'album':
        list.sort(
          (a, b) =>
            (a.album ?? '').localeCompare(b.album ?? '') ||
            a.title.localeCompare(b.title),
        )
        break
    }
    return list
  }, [tracks, filter, sort])

  async function runImport(files: FileList | null) {
    if (!files || files.length === 0) return
    setLastResult(null)
    const result = await importFiles(files, setProgress)
    setProgress(null)
    setLastResult(result)
    if (navigator.storage?.estimate) {
      const est = await navigator.storage.estimate()
      if (est.usage) setUsage(formatBytes(est.usage))
    }
  }

  async function handleDelete(track: Track) {
    await deleteLocalTrack(track)
  }

  const importing = progress !== null

  return (
    <>
      <PageHeading title="Your Library">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={importing}
            className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-black transition-colors hover:bg-zinc-200 disabled:opacity-50"
          >
            <PlusIcon width="16" height="16" />
            Import files
          </button>
          <button
            type="button"
            onClick={() => folderInput.current?.click()}
            disabled={importing}
            className="hidden rounded-full bg-zinc-800 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 md:block"
          >
            Import folder
          </button>
        </div>
      </PageHeading>

      <p className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <Link to="/downloads" className="text-zinc-400 underline-offset-2 hover:text-white hover:underline">
          Manage offline downloads →
        </Link>
        <Link to="/settings" className="text-zinc-400 underline-offset-2 hover:text-white hover:underline">
          Settings →
        </Link>
      </p>

      <input
        ref={fileInput}
        type="file"
        multiple
        accept="audio/*,.mp3,.flac,.m4a,.aac,.ogg,.opus,.wav"
        className="hidden"
        onChange={(e) => {
          void runImport(e.target.files)
          e.target.value = ''
        }}
      />
      <input
        ref={folderInput}
        type="file"
        // @ts-expect-error non-standard but widely supported on desktop
        webkitdirectory=""
        className="hidden"
        onChange={(e) => {
          void runImport(e.target.files)
          e.target.value = ''
        }}
      />

      {importing && progress && (
        <div className="mb-6 rounded-lg bg-zinc-900 p-4">
          <p className="mb-2 text-sm text-zinc-300">
            Importing {progress.done + 1} of {progress.total}
            {progress.currentFile && (
              <span className="text-zinc-500"> — {progress.currentFile}</span>
            )}
          </p>
          <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full bg-accent transition-all"
              style={{ width: `${(progress.done / Math.max(progress.total, 1)) * 100}%` }}
            />
          </div>
        </div>
      )}

      {lastResult && (
        <p className="mb-4 text-sm text-zinc-400">
          Imported {lastResult.added} track{lastResult.added === 1 ? '' : 's'}
          {lastResult.skipped > 0 && <>, skipped {lastResult.skipped} duplicate{lastResult.skipped === 1 ? '' : 's'}</>}
          {lastResult.failed > 0 && (
            <span className="text-red-400">
              , {lastResult.failed} failed ({lastResult.failures.slice(0, 3).join(', ')}
              {lastResult.failures.length > 3 ? ', …' : ''})
            </span>
          )}
          {usage && <> · {usage} used</>}
        </p>
      )}

      {tracks && tracks.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <SearchIcon
              width="16"
              height="16"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <input
              type="search"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter your library"
              className="w-full rounded-full bg-zinc-800 py-2 pl-9 pr-4 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            aria-label="Sort library"
            className="rounded-full bg-zinc-800 px-4 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-white/30"
          >
            {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
              <option key={key} value={key}>
                {SORT_LABELS[key]}
              </option>
            ))}
          </select>
        </div>
      )}

      {visibleTracks && visibleTracks.length > 0 && (
        <TrackList
          tracks={visibleTracks}
          onPlay={(i) => playQueue(visibleTracks, i)}
          renderActions={(track) => (
            <TrackActions
              track={track}
              extraActions={[
                {
                  label: 'Remove from library',
                  onClick: () => void handleDelete(track),
                },
              ]}
            />
          )}
        />
      )}
      {tracks && tracks.length > 0 && visibleTracks?.length === 0 && (
        <EmptyState title={`Nothing matches “${filter.trim()}”`} />
      )}
      {tracks && tracks.length === 0 && (
        <EmptyState title="Your library is empty">
          Import music files from your device — they're stored locally in your
          browser and play fully offline. Your files never leave this device.
        </EmptyState>
      )}
    </>
  )
}
