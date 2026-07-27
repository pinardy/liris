import { Link } from 'react-router'
import ArtworkImage from './ArtworkImage'

interface Props {
  to: string
  title: string
  subtitle?: string
  imageUrl?: string
  round?: boolean
}

/** Grid card for an album or artist. */
export default function MediaCard({ to, title, subtitle, imageUrl, round }: Props) {
  return (
    <Link
      to={to}
      className="group flex flex-col gap-2 rounded-lg bg-zinc-900/60 p-3 transition-colors hover:bg-zinc-800"
    >
      <ArtworkImage
        src={imageUrl}
        alt=""
        className="aspect-square w-full"
        rounded={round ? 'rounded-full' : 'rounded-md'}
      />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{title}</p>
        {subtitle && <p className="truncate text-xs text-zinc-400">{subtitle}</p>}
      </div>
    </Link>
  )
}
