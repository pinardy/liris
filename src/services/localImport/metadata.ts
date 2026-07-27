export interface ParsedAudioMeta {
  title: string
  artist: string
  album?: string
  durationSec: number
  /** Raw embedded picture, if any. */
  picture?: { data: Uint8Array; format: string }
}

/**
 * Parse tags from an audio file. music-metadata is ~200 KB gz, so it is
 * dynamically imported — it only ever loads inside the import flow.
 */
export async function parseAudioMetadata(file: File): Promise<ParsedAudioMeta> {
  const { parseBlob } = await import('music-metadata')
  const meta = await parseBlob(file, { skipPostHeaders: true })
  const fallbackTitle = file.name.replace(/\.[^.]+$/, '')
  const picture = meta.common.picture?.[0]
  return {
    title: meta.common.title?.trim() || fallbackTitle,
    artist: meta.common.artist?.trim() || 'Unknown artist',
    album: meta.common.album?.trim() || undefined,
    durationSec: meta.format.duration ?? 0,
    picture: picture ? { data: picture.data, format: picture.format } : undefined,
  }
}

/** Downscale embedded cover art to max 512px JPEG so multi-MB art doesn't bloat IndexedDB. */
export async function downscaleArtwork(
  data: Uint8Array,
  format: string,
): Promise<Blob | undefined> {
  const source = new Blob([data as BlobPart], { type: format })
  try {
    const bitmap = await createImageBitmap(source)
    const scale = Math.min(1, 512 / Math.max(bitmap.width, bitmap.height))
    if (scale === 1 && source.size < 200 * 1024) {
      bitmap.close()
      return source
    }
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) return source
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    return await new Promise<Blob | undefined>((resolve) =>
      canvas.toBlob((b) => resolve(b ?? undefined), 'image/jpeg', 0.85),
    )
  } catch {
    // Unsupported image format — keep the original if it's reasonably small.
    return source.size < 500 * 1024 ? source : undefined
  }
}
