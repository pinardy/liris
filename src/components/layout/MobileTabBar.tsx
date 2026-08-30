import { NavLink } from 'react-router'
import { navItems } from './navItems'

export default function MobileTabBar() {
  return (
    // z-40 keeps navigation tappable above the queue panel's scrim.
    <nav
      aria-label="Main"
      className="pb-safe px-safe relative z-40 flex border-t border-zinc-800 bg-black md:hidden"
    >
      {navItems.map(({ to, short, icon: ItemIcon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium ${
              isActive ? 'text-white' : 'text-zinc-400'
            }`
          }
        >
          <ItemIcon width="22" height="22" />
          {short}
        </NavLink>
      ))}
    </nav>
  )
}
