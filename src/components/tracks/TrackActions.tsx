import { useContext, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { toast } from '../../lib/toast'
import { usePlayerStore } from '../../player/playerStore'
import {
  downloadTrack,
  isDownloadable,
  isQuotaError,
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
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  // Rows near the bottom of the viewport would open the menu off-screen.
  const [dropUp, setDropUp] = useState(false)

  useLayoutEffect(() => {
    if (!menuOpen) return
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return
    const menuHeight = menuRef.current?.offsetHeight ?? 0
    setDropUp(rect.bottom + menuHeight + 16 > window.innerHeight)
  }, [menuOpen])

  useEffect(() => {
    if (!menuOpen) return
    const menu = menuRef.current
    menu?.querySelector<HTMLElement>('[role="menuitem"]')?.focus()

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        setMenuOpen(false)
        triggerRef.current?.focus()
        return
      }
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
      const items = Array.from(
        menu?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [],
      )
      if (items.length === 0) return
      e.preventDefault()
      const current = items.indexOf(document.activeElement as HTMLElement)
      const step = e.key === 'ArrowDown' ? 1 : -1
      items[(current + step + items.length) % items.length].focus()
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [menuOpen])

  function closeMenu() {
    setMenuOpen(false)
    triggerRef.current?.focus()
  }

  async function handleDownload() {
    setDownloading(true)
    // The menu closes on click, taking the "Downloading…" label with it — so
    // the start of a possibly-large transfer is announced here instead.
    toast(`Downloading “${track.title}”…`)
    try {
      await downloadTrack(track)
      toast('Downloaded for offline listening')
    } catch (err) {
      console.error('Download failed', err)
      toast(
        isQuotaError(err)
          ? 'Storage is full — remove downloads in Your Library first'
          : 'Download failed — try again',
        { tone: 'error' },
      )
    } finally {
      setDownloading(false)
    }
  }

  async function handleRemoveDownload() {
    await removeDownload(track.id)
    toast(`Removed download — ${track.title}`)
  }

  return (
    <span className="relative flex items-center gap-1">
      <button
        type="button"
        onClick={() => void toggleFavorite(track)}
        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        aria-pressed={Boolean(isFavorite)}
        className={`flex size-11 items-center justify-center md:size-8 ${
          isFavorite
            ? 'text-accent'
            : // Revealed by hover OR focus: `invisible` elements still take
              // keyboard focus, so hover-only left a control you could focus
              // but never see.
              'text-zinc-400 hover:text-white md:invisible md:group-focus-within:visible md:group-hover:visible'
        }`}
      >
        <HeartIcon width="16" height="16" fill={isFavorite ? 'currentColor' : 'none'} />
      </button>

      <button
        ref={triggerRef}
        type="button"
        onClick={() => setMenuOpen((o) => !o)}
        aria-label="More options"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        className="flex size-11 items-center justify-center text-zinc-400 hover:text-white md:invisible md:size-8 md:group-focus-within:visible md:group-hover:visible"
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
          <div
            ref={menuRef}
            role="menu"
            aria-label={`Actions for ${track.title}`}
            className={`absolute right-0 z-40 w-44 rounded-md border border-zinc-700 bg-zinc-800 py-1 shadow-xl ${
              dropUp ? 'bottom-full mb-1' : 'top-full mt-1'
            }`}
          >
            <MenuItem
              label="Play next"
              onClick={() => {
                playNext(track)
                toast('Playing next')
                closeMenu()
              }}
            />
            <MenuItem
              label="Add to queue"
              onClick={() => {
                addToQueue(track)
                toast('Added to queue')
                closeMenu()
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
                    closeMenu()
                    void handleRemoveDownload()
                  }}
                />
              ) : (
                <MenuItem
                  label={downloading ? 'Downloading…' : 'Download for offline'}
                  onClick={() => {
                    if (downloading) return
                    closeMenu()
                    void handleDownload()
                  }}
                />
              ))}
            {extraActions.map((action) => (
              <MenuItem
                key={action.label}
                label={action.label}
                onClick={() => {
                  closeMenu()
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
      role="menuitem"
      onClick={onClick}
      className="block w-full px-3 py-2.5 text-left text-sm text-zinc-200 hover:bg-zinc-700 focus:bg-zinc-700 focus:outline-none"
    >
      {label}
    </button>
  )
}
