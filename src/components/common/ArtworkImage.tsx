import { useEffect, useRef, useState } from 'react'
import { MusicNoteIcon } from './icons'

interface Props {
  src?: string
  alt?: string
  className?: string
  rounded?: string
}

/**
 * Artwork tile that fades the image in over a placeholder, so a list filling
 * in top-to-bottom eases in rather than popping. The placeholder sits in a
 * fixed-size container and the image fills it absolutely, which also means
 * arriving images cause no layout shift.
 */
export default function ArtworkImage({
  src,
  alt = '',
  className = 'size-12',
  rounded = 'rounded',
}: Props) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
    // Cached images can finish decoding before React attaches onLoad, which
    // would leave them stuck at opacity 0 — so treat an already-complete
    // image as loaded and skip the fade entirely.
    const img = imgRef.current
    setLoaded(Boolean(img?.complete && img.naturalWidth > 0))
  }, [src])

  return (
    <div
      className={`relative shrink-0 overflow-hidden bg-zinc-800 ${rounded} ${className}`}
    >
      <div className="absolute inset-0 flex items-center justify-center text-zinc-600">
        <MusicNoteIcon width="40%" height="40%" />
      </div>
      {src && !failed && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`absolute inset-0 size-full object-cover transition-opacity duration-500 ease-out motion-reduce:transition-none ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  )
}
