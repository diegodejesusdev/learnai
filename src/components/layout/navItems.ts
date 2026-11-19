import {
  CalendarDays,
  House,
  MessageCircle,
  Route,
  Settings,
  Timer,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  /** Solo activo en la ruta exacta (para Inicio). */
  end?: boolean
}

export const mainNavItems: readonly NavItem[] = [
  { to: '/', label: 'Inicio', icon: House, end: true },
  { to: '/ruta', label: 'Ruta', icon: Route },
  { to: '/estudiar', label: 'Estudiar', icon: Timer },
  { to: '/historial', label: 'Historial', icon: CalendarDays },
  { to: '/tutor', label: 'Tutor', icon: MessageCircle },
]

export const settingsNavItem: NavItem = { to: '/ajustes', label: 'Ajustes', icon: Settings }
