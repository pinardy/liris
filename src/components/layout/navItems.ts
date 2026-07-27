import type { ComponentType, SVGProps } from 'react'
import {
  HomeIcon,
  SearchIcon,
  LibraryIcon,
  PlaylistIcon,
  HeartIcon,
} from '../common/icons'

export interface NavItem {
  to: string
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
}

export const navItems: NavItem[] = [
  { to: '/', label: 'Home', icon: HomeIcon },
  { to: '/search', label: 'Search', icon: SearchIcon },
  { to: '/library', label: 'Your Library', icon: LibraryIcon },
  { to: '/playlists', label: 'Playlists', icon: PlaylistIcon },
  { to: '/favorites', label: 'Favorites', icon: HeartIcon },
]
