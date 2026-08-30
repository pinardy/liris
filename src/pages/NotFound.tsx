import { Link, useLocation } from 'react-router'
import { buttonClass } from '../components/common/buttonStyles'

/**
 * Catch-all for unknown URLs. Without it an unmatched path rendered an empty
 * page — no message and no way out, which is especially bad here because the
 * app is deployed under a subpath and deep links are shareable.
 */
export default function NotFound() {
  const { pathname } = useLocation()
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-xl font-bold">This page doesn't exist</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Nothing lives at <span className="break-all font-mono text-xs">{pathname}</span>.
        The link may be out of date, or the page may have moved.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link to="/" className={buttonClass('primary', 'sm')}>
          Go home
        </Link>
        <Link to="/search" className={buttonClass('outline', 'sm')}>
          Search
        </Link>
        <Link to="/composers" className={buttonClass('outline', 'sm')}>
          Browse composers
        </Link>
      </div>
    </div>
  )
}
