import { useContext, useState } from 'react'
import { usePlayerStore } from '../../player/playerStore'
import {
  downloadTrack,
  isDownloadable,
  removeDownload,
} from '../../services/db/downloads'
import { toggleFavorite } from '../../services/db/favorites'
import type { Track } from '../../types/model'
import { DotsIcon, HeartIcon } from '../common/icons'
import PlaylistPickerModal from '../playlists/PlaylistPickerModal'
import { DownloadedIdsContext, FavoriteIdsContext } from './favoritesContext'

export interface ExtraAction {
  label: string
  onClick: () => void
}

/**
 * Standard per-row actions: favorite toggle + overflow menu
 * (add to queue / add to playlist / page-specific extras).
 */
export default function TrackActions({
  track,
  extraActions = [],
}: {
  track: Track
  extraActions?: ExtraAction[]
}) {
  // One shared live query in TrackList feeds every row via context.
  const isFavorite = useContext(FavoriteIdsContext)?.has(track.id) ?? false
  const isDownloaded = useContext(DownloadedIdsContext)?.has(track.id) ?? false
  const addToQueue = usePlayerStore((s) => s.addToQueue)
  const playNext = usePlayerStore((s) => s.playNext)
  const [menuOpen, setMenuOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [downloading, setDownloading] = useState(false)

  async function handleDownload() {
    setDownloading(true)
    try {
      await downloadTrack(track)
    } catch (err) {
      console.error('Download failed', err)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <span className="relative flex items-center gap-1">
      <button
        type="button"
        onClick={() => void toggleFavorite(track)}
        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        aria-pressed={Boolean(isFavorite)}
        className={
          isFavorite
            ? 'text-accent'
            : 'text-zinc-500 hover:text-white md:invisible md:group-hover:visible'
        }
      >
        <HeartIcon width="16" height="16" fill={isFavorite ? 'currentColor' : 'none'} />
      </button>

      <button
        type="button"
        onClick={() => setMenuOpen((o) => !o)}
        aria-label="More options"
        aria-expanded={menuOpen}
        className="text-zinc-500 hover:text-white md:invisible md:group-hover:visible"
      >
        <DotsIcon width="18" height="18" />
      </button>

      {menuOpen && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-30 cursor-default"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute right-0 top-full z-40 mt-1 w-44 rounded-md border border-zinc-700 bg-zinc-800 py-1 shadow-xl">
            <MenuItem
              label="Play next"
              onClick={() => {
                playNext(track)
                setMenuOpen(false)
              }}
            />
            <MenuItem
              label="Add to queue"
              onClick={() => {
                addToQueue(track)
                setMenuOpen(false)
              }}
            />
            <MenuItem
              label="Add to playlist"
              onClick={() => {
                setMenuOpen(false)
                setPickerOpen(true)
              }}
            />
            {isDownloadable(track) &&
              (isDownloaded ? (
                <MenuItem
                  label="Remove download"
                  onClick={() => {
                    setMenuOpen(false)
                    void removeDownload(track.id)
                  }}
                />
              ) : (
                <MenuItem
                  label={downloading ? 'Downloading…' : 'Download for offline'}
                  onClick={() => {
                    if (downloading) return
                    setMenuOpen(false)
                    void handleDownload()
                  }}
                />
              ))}
            {extraActions.map((action) => (
              <MenuItem
                key={action.label}
                label={action.label}
                onClick={() => {
                  setMenuOpen(false)
                  action.onClick()
                }}
              />
            ))}
          </div>
        </>
      )}

      {pickerOpen && (
        <PlaylistPickerModal track={track} onClose={() => setPickerOpen(false)} />
      )}
    </span>
  )
}

function MenuItem({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full px-3 py-1.5 text-left text-sm text-zinc-200 hover:bg-zinc-700"
    >
      {label}
    </button>
  )
}
