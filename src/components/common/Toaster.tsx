import { useEffect, useState } from 'react'
import { onToast } from '../../lib/toast'
import { onTrackError } from '../../player/audioEngine'

interface Toast {
  id: number
  message: string
}

let toastId = 0

/** Lightweight toast list: playback errors plus app-wide action confirmations. */
export default function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    function push(message: string) {
      const id = ++toastId
      setToasts((t) => [...t, { id, message }])
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000)
    }
    const offError = onTrackError((track) =>
      push(`Couldn't play “${track.title}” — skipped.`),
    )
    const offToast = onToast(push)
    return () => {
      offError()
      offToast()
    }
  }, [])

  if (toasts.length === 0) return null
  return (
    <div className="pointer-events-none fixed bottom-24 left-1/2 z-50 flex -translate-x-1/2 flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="rounded-md bg-zinc-800 px-4 py-2 text-sm text-white shadow-lg"
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}
