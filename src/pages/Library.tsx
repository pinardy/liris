import { useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import PageHeading from '../components/common/PageHeading'
import { EmptyState } from '../components/common/Status'
import { PlusIcon, SearchIcon } from '../components/common/icons'
import TrackActions from '../components/tracks/TrackActions'
import TrackList from '../components/tracks/TrackList'
import { fold } from '../lib/composers'
import { formatBytes } from '../lib/format'
import { toast } from '../lib/toast'
import { useConfirm } from '../hooks/useConfirm'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
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
  // Sort lives in the URL so it survives opening a track and coming back —
  // the same reason Search keeps its state there.
  const [params, setParams] = useSearchParams()
  const sort = (params.get('sort') as SortKey | null) ?? 'recent'
  function setSort(next: SortKey) {
    const p = new URLSearchParams(params)
    if (next === 'recent') p.delete('sort')
    else p.set('sort', next)
    setParams(p, { replace: true })
  }
  // Matches Search's behaviour: debounced, and folded so 'Dvorak' finds
  // Dvořák here too.
  const debouncedFilter = useDebouncedValue(fold(filter.trim()), 200)
  const { confirm, confirmDialog } = useConfirm()
  const abortImport = useRef<AbortController | null>(null)

  const visibleTracks = useMemo(() => {
    if (!tracks) return undefined
    const q = debouncedFilter
    const list = q
      ? tracks.filter(
          (t) =>
            fold(t.title).includes(q) ||
            fold(t.artist).includes(q) ||
            fold(t.album ?? '').includes(q),
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
  }, [tracks, debouncedFilter, sort])

  async function runImport(files: FileList | null) {
    if (!files || files.length === 0) return
    setLastResult(null)
    const controller = new AbortController()
    abortImport.current = controller
    const result = await importFiles(files, setProgress, controller.signal)
    abortImport.current = null
    setProgress(null)
    setLastResult(result)
    if (navigator.storage?.estimate) {
      const est = await navigator.storage.estimate()
      if (est.usage) setUsage(formatBytes(est.usage))
    }
  }

  /**
   * This deletes the imported audio itself, not a reference to it — the only
   * copy the app has. There is nothing to undo it with, so it asks first.
   */
  function handleDelete(track: Track) {
    confirm({
      title: 'Remove from library',
      message: (
        <>
          “{track.title}” will be deleted from this device. The imported audio
          file is stored only here, so this can't be undone — you'd have to
          import it again from your own copy.
        </>
      ),
      confirmLabel: 'Remove',
      onConfirm: () => {
        void deleteLocalTrack(track).then(() => toast(`Removed “${track.title}”`))
      },
    })
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

      {/* On mobile this row is the only route to the sidebar's secondary
          destinations (the tab bar has no slot for them), so the sidebar-only
          pages get md:hidden links here. */}
      <p className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <Link to="/downloads" className="text-zinc-400 underline-offset-2 hover:text-white hover:underline">
          Manage offline downloads →
        </Link>
        <Link to="/bookmarks" className="text-zinc-400 underline-offset-2 hover:text-white hover:underline md:hidden">
          Bookmarks →
        </Link>
        <Link to="/history" className="text-zinc-400 underline-offset-2 hover:text-white hover:underline md:hidden">
          History →
        </Link>
        <Link to="/contemporary" className="text-zinc-400 underline-offset-2 hover:text-white hover:underline md:hidden">
          Contemporary →
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
            {/* done counts finished files, and the last callback reports
                done === total — so clamp rather than showing "5 of 4". */}
            Importing {Math.min(progress.done + 1, progress.total)} of {progress.total}
            {progress.currentFile && (
              <span className="text-zinc-400"> — {progress.currentFile}</span>
            )}
            <button
              type="button"
              onClick={() => abortImport.current?.abort()}
              className="ml-3 text-xs text-zinc-400 underline-offset-2 hover:text-white hover:underline"
            >
              Stop
            </button>
          </p>
          <div
            role="progressbar"
            aria-label="Import progress"
            aria-valuemin={0}
            aria-valuemax={progress.total}
            aria-valuenow={progress.done}
            className="h-1.5 overflow-hidden rounded-full bg-zinc-800"
          >
            <div
              className="h-full bg-accent transition-all"
              style={{ width: `${(progress.done / Math.max(progress.total, 1)) * 100}%` }}
            />
          </div>
        </div>
      )}

      {lastResult && (
        <p className="mb-4 text-sm text-zinc-400">
          {lastResult.cancelled && 'Stopped — '}
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
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            />
            <input
              type="search"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter your library"
              className="w-full rounded-full bg-zinc-800 py-2 pl-9 pr-4 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-white/30"
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
                  onClick: () => handleDelete(track),
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
        <EmptyState
          title="Your library is empty"
          action={{ label: 'Import files', onClick: () => fileInput.current?.click() }}
        >
          Import music files from your device — they're stored locally in your
          browser and play fully offline. Your files never leave this device.
        </EmptyState>
      )}
      {confirmDialog}
    </>
  )
}
