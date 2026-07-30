import type { ButtonHTMLAttributes } from 'react'
import { PlayIcon } from './icons'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Render as a decorative `<span>` when the whole enclosing element is the
   *  click target (e.g. a card wrapped in a `<Link>`); hover then follows the
   *  parent's `group` instead of the button itself. */
  decorative?: boolean
  iconSize?: number
}

/** The large white circular play affordance used on cards and the quiz. */
export default function PlayButton({
  decorative = false,
  iconSize = 18,
  className = '',
  ...rest
}: Props) {
  const cls = `flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-black transition-transform ${
    decorative ? 'group-hover:scale-105' : 'hover:scale-105'
  } ${className}`.trim()
  const icon = <PlayIcon width={iconSize} height={iconSize} className="translate-x-px" />
  if (decorative) return <span className={cls}>{icon}</span>
  return (
    <button type="button" className={cls} {...rest}>
      {icon}
    </button>
  )
}
