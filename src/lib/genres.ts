export interface Genre {
  /** Jamendo fuzzytags value */
  tag: string
  label: string
  /** Tailwind gradient classes for the category card */
  color: string
}

export const genres: Genre[] = [
  { tag: 'pop', label: 'Pop', color: 'from-pink-500 to-rose-600' },
  { tag: 'rock', label: 'Rock', color: 'from-red-500 to-orange-600' },
  { tag: 'electronic', label: 'Electronic', color: 'from-cyan-500 to-blue-600' },
  { tag: 'hiphop', label: 'Hip-Hop', color: 'from-amber-500 to-orange-700' },
  { tag: 'classical', label: 'Classical', color: 'from-indigo-500 to-purple-700' },
  { tag: 'jazz', label: 'Jazz', color: 'from-yellow-500 to-amber-700' },
  { tag: 'metal', label: 'Metal', color: 'from-zinc-500 to-zinc-800' },
  { tag: 'ambient', label: 'Ambient', color: 'from-teal-500 to-emerald-700' },
  { tag: 'folk', label: 'Folk', color: 'from-lime-500 to-green-700' },
  { tag: 'blues', label: 'Blues', color: 'from-blue-600 to-indigo-800' },
  { tag: 'reggae', label: 'Reggae', color: 'from-green-500 to-yellow-600' },
  { tag: 'country', label: 'Country', color: 'from-orange-400 to-amber-600' },
  { tag: 'punk', label: 'Punk', color: 'from-fuchsia-500 to-purple-700' },
  { tag: 'world', label: 'World', color: 'from-slate-500 to-slate-700' },
  { tag: 'house', label: 'House', color: 'from-violet-500 to-fuchsia-700' },
  { tag: 'lounge', label: 'Lounge', color: 'from-emerald-400 to-teal-600' },
]

export function findGenre(tag: string): Genre | undefined {
  return genres.find((g) => g.tag === tag)
}
