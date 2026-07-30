export type ButtonVariant = 'primary' | 'outline' | 'subtle'
export type ButtonSize = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 rounded-full transition-colors disabled:opacity-50'

const variants: Record<ButtonVariant, string> = {
  // The prominent call-to-action (Play / Play all).
  primary: 'bg-accent font-bold text-black hover:bg-accent-hover',
  // A bold secondary action sitting next to a primary one (Radio, Score, …).
  outline: 'border border-zinc-600 font-bold text-white hover:border-white',
  // A quieter action (Rename, Delete, Edit rules, Remove all).
  subtle:
    'border border-zinc-700 font-medium text-zinc-300 hover:border-zinc-500 hover:text-white',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'px-5 py-2 text-sm',
  md: 'px-6 py-2.5 text-sm',
  lg: 'px-8 py-3 text-sm',
}

/**
 * Shared class string for the app's pill buttons, so non-`<button>` triggers
 * (`<a>`, react-router `<Link>`) can wear the same look without duplicating it.
 */
export function buttonClass(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className = '',
): string {
  return `${base} ${variants[variant]} ${sizes[size]} ${className}`.trim()
}
