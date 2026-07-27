import type { ComponentType, SVGProps } from 'react'
import {
  HomeIcon,
  SearchIcon,
  LibraryIcon,
  PlaylistIcon,
  HeartIcon,
  MusicNoteIcon,
} from '../common/icons'

export interface NavItem {
  to: string
  label: string
  /** Short label for the mobile tab bar. */
  short: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
}

export const navItems: NavItem[] = [
  { to: '/', label: 'Home', short: 'Home', icon: HomeIcon },
  { to: '/search', label: 'Search', short: 'Search', icon: SearchIcon },
  { to: '/composers', label: 'Composers', short: 'Composers', icon: MusicNoteIcon },
  { to: '/library', label: 'Your Library', short: 'Library', icon: LibraryIcon },
  { to: '/playlists', label: 'Playlists', short: 'Lists', icon: PlaylistIcon },
  { to: '/favorites', label: 'Favorites', short: 'Saved', icon: HeartIcon },
]
