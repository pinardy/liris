import { NavLink } from 'react-router'
import { navItems } from './navItems'

export default function MobileTabBar() {
  return (
    <nav className="pb-safe px-safe flex border-t border-zinc-800 bg-black md:hidden">
      {navItems.map(({ to, short, icon: ItemIcon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium ${
              isActive ? 'text-white' : 'text-zinc-500'
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
