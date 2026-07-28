import { useEffect, useRef, useState } from 'react'
import { composerImageUrl } from '../../lib/composers'

interface Props {
  slug: string
  /** Used for the initials fallback and the alt text. */
  name: string
  /** Sizing classes for the circle, e.g. 'size-11' or 'size-40 sm:size-48'. */
  className?: string
  /** Requested image width in px; pick roughly 2× the rendered size. */
  width?: number
}

/**
 * Round composer portrait that fades in over an initials placeholder, falling
 * back to the initials permanently if there's no image or it fails to load.
 * Portraits are cropped from the top, since faces sit high in most paintings.
 */
export default function ComposerAvatar({
  slug,
  name,
  className = 'size-11',
  width = 200,
}: Props) {
  const src = composerImageUrl(slug, width)
  const imgRef = useRef<HTMLImageElement>(null)
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
    const img = imgRef.current
    setLoaded(Boolean(img?.complete && img.naturalWidth > 0))
  }, [src])

  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-indigo-800 to-zinc-800 ${className}`}
    >
      <span className="select-none font-bold text-indigo-200/90 [font-size:36%]">
        {name.slice(0, 2)}
      </span>
      {src && !failed && (
        <img
          ref={imgRef}
          src={src}
          alt={name}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`absolute inset-0 size-full object-cover object-top transition-opacity duration-500 ease-out motion-reduce:transition-none ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </span>
  )
}
