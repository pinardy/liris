import { NavLink } from 'react-router'
import { MusicNoteIcon } from '../common/icons'
import { navItems } from './navItems'

export default function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 flex-col gap-1 border-r border-zinc-800 bg-black p-4 md:flex">
      <div className="mb-6 flex items-center gap-2 px-2 text-lg font-bold">
        <MusicNoteIcon className="text-accent" />
        liris
      </div>
      <nav className="flex flex-col gap-1">
        {navItems.map(({ to, label, icon: ItemIcon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
              }`
            }
          >
            <ItemIcon />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
