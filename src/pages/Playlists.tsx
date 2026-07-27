import { useRef, useState } from 'react'
import { Link } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import PageHeading from '../components/common/PageHeading'
import { EmptyState } from '../components/common/Status'
import { PlaylistIcon, PlusIcon } from '../components/common/icons'
import Modal from '../components/common/Modal'
import { exportBackup, importBackup } from '../services/db/backup'
import { createPlaylist, getPlaylists } from '../services/db/playlists'

export default function Playlists() {
  const playlists = useLiveQuery(getPlaylists, [])
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const importInput = useRef<HTMLInputElement>(null)
  const [backupMessage, setBackupMessage] = useState<string>()

  async function create() {
    const trimmed = name.trim()
    if (!trimmed) return
    await createPlaylist(trimmed)
    setName('')
    setCreating(false)
  }

  async function handleExport() {
    const blob = await exportBackup()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `liris-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleImport(file: File | undefined) {
    if (!file) return
    try {
      const result = await importBackup(file)
      setBackupMessage(
        `Restored ${result.playlists} playlist${result.playlists === 1 ? '' : 's'} and ${result.favorites} favorite${result.favorites === 1 ? '' : 's'}.`,
      )
    } catch (err) {
      setBackupMessage(err instanceof Error ? err.message : 'Import failed')
    }
  }

  return (
    <>
      <PageHeading title="Playlists">
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-black transition-colors hover:bg-zinc-200"
        >
          <PlusIcon width="16" height="16" />
          New playlist
        </button>
      </PageHeading>

      <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
        <button
          type="button"
          onClick={() => void handleExport()}
          className="text-zinc-400 underline-offset-2 hover:text-white hover:underline"
        >
          Export backup
        </button>
        <span className="text-zinc-700">·</span>
        <button
          type="button"
          onClick={() => importInput.current?.click()}
          className="text-zinc-400 underline-offset-2 hover:text-white hover:underline"
        >
          Import backup
        </button>
        <span className="text-xs text-zinc-500">
          Backs up playlists &amp; favorites (not local audio files).
        </span>
        {backupMessage && <span className="text-xs text-accent">{backupMessage}</span>}
        <input
          ref={importInput}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            void handleImport(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </div>

      {creating && (
        <Modal title="New playlist" onClose={() => setCreating(false)}>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              void create()
            }}
          >
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Playlist name"
              autoFocus
              className="min-w-0 flex-1 rounded-md bg-zinc-800 px-3 py-2 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
            <button
              type="submit"
              disabled={!name.trim()}
              className="rounded-md bg-white px-4 py-2 text-sm font-bold text-black hover:bg-zinc-200 disabled:opacity-50"
            >
              Create
            </button>
          </form>
        </Modal>
      )}

      {playlists && playlists.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {playlists.map((p) => (
            <Link
              key={p.id}
              to={`/playlists/${p.id}`}
              className="group flex flex-col gap-2 rounded-lg bg-zinc-900/60 p-3 transition-colors hover:bg-zinc-800"
            >
              <div className="flex aspect-square w-full items-center justify-center rounded-md bg-zinc-800 text-zinc-600">
                <PlaylistIcon width="40%" height="40%" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{p.name}</p>
                <p className="text-xs text-zinc-400">
                  {p.trackIds.length} track{p.trackIds.length === 1 ? '' : 's'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        playlists && (
          <EmptyState title="No playlists yet">
            Create a playlist and mix Jamendo tracks with your own files — playback
            moves seamlessly between both.
          </EmptyState>
        )
      )}
    </>
  )
}
