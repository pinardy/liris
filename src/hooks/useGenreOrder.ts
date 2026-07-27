import { useMemo, useState } from 'react'
import { genres, type Genre } from '../lib/genres'

const STORAGE_KEY = 'genre-order'

function loadOrder(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as unknown
    return Array.isArray(raw) ? raw.filter((t): t is string => typeof t === 'string') : []
  } catch {
    return []
  }
}

/**
 * User-customizable genre ordering, persisted in localStorage. Saved tags come
 * first (in saved order); any genres not in the saved list keep their default
 * position after them — so new genres added in code still show up.
 */
export function useGenreOrder(): {
  orderedGenres: Genre[]
  moveGenre: (fromTag: string, toTag: string) => void
} {
  const [order, setOrder] = useState<string[]>(loadOrder)

  const orderedGenres = useMemo(() => {
    const byTag = new Map(genres.map((g) => [g.tag, g]))
    const front = order
      .map((tag) => byTag.get(tag))
      .filter((g): g is Genre => Boolean(g))
    const rest = genres.filter((g) => !order.includes(g.tag))
    return [...front, ...rest]
  }, [order])

  function moveGenre(fromTag: string, toTag: string) {
    if (fromTag === toTag) return
    const tags = orderedGenres.map((g) => g.tag)
    const from = tags.indexOf(fromTag)
    const to = tags.indexOf(toTag)
    if (from === -1 || to === -1) return
    const [moved] = tags.splice(from, 1)
    tags.splice(to, 0, moved)
    setOrder(tags)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tags))
  }

  return { orderedGenres, moveGenre }
}
