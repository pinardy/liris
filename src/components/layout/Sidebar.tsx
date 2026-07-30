import { NavLink } from 'react-router'
import { navItems } from './navItems'

export default function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 flex-col gap-1 border-r border-zinc-800 bg-black p-4 md:flex">
      <div className="mb-6 flex items-center gap-2.5 px-2">
        <img
          src={`${import.meta.env.BASE_URL}logo.png`}
          alt=""
          width="40"
          height="40"
          className="size-10 rounded-lg"
        />
        <div>
          <div className="text-lg font-bold leading-none">Liris</div>
          <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
            Classical
          </p>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1">
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

        <div className="mt-4 flex flex-col gap-3 border-t border-zinc-800 pt-4">
          <NavLink
            to="/history"
            className={({ isActive }) =>
              `px-3 text-xs font-medium transition-colors ${
                isActive ? 'text-white' : 'text-zinc-500 hover:text-white'
              }`
            }
          >
            History
          </NavLink>
          <NavLink
            to="/bookmarks"
            className={({ isActive }) =>
              `px-3 text-xs font-medium transition-colors ${
                isActive ? 'text-white' : 'text-zinc-500 hover:text-white'
              }`
            }
          >
            Bookmarks
          </NavLink>
          <NavLink
            to="/downloads"
            className={({ isActive }) =>
              `px-3 text-xs font-medium transition-colors ${
                isActive ? 'text-white' : 'text-zinc-500 hover:text-white'
              }`
            }
          >
            Downloads
          </NavLink>
          <NavLink
            to="/contemporary"
            className={({ isActive }) =>
              `px-3 text-xs font-medium transition-colors ${
                isActive ? 'text-white' : 'text-zinc-500 hover:text-white'
              }`
            }
          >
            Contemporary →
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `px-3 text-xs font-medium transition-colors ${
                isActive ? 'text-white' : 'text-zinc-500 hover:text-white'
              }`
            }
          >
            Settings
          </NavLink>
        </div>
      </nav>
    </aside>
  )
}
