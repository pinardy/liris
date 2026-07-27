import { useState } from 'react'
import { MusicNoteIcon } from './icons'

interface Props {
  src?: string
  alt?: string
  className?: string
  rounded?: string
}

/** Artwork <img> that falls back to a placeholder tile when missing or broken. */
export default function ArtworkImage({
  src,
  alt = '',
  className = 'size-12',
  rounded = 'rounded',
}: Props) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <div
        className={`flex items-center justify-center bg-zinc-800 text-zinc-600 ${rounded} ${className}`}
      >
        <MusicNoteIcon width="40%" height="40%" />
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`shrink-0 object-cover ${rounded} ${className}`}
    />
  )
}
