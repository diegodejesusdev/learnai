import { NavLink } from 'react-router'
import { cn } from '@/lib/cn'
import { Brand } from './Brand'
import { ConnectionStatus } from './ConnectionStatus'
import { mainNavItems, settingsNavItem, type NavItem } from './navItems'

function SidebarLink({ to, label, icon: Icon, end }: NavItem) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex min-h-13 items-center gap-3.5 px-6 font-semibold transition-colors focus-visible:-outline-offset-4',
          isActive
            ? 'bg-hero text-hero-fg'
            : 'text-chrome-muted hover:bg-chrome-hover hover:text-chrome-fg',
        )
      }
    >
      <Icon className="size-5" />
      {label}
    </NavLink>
  )
}

/** Navegación de escritorio (desde 1024 px). */
export function Sidebar() {
  return (
    <aside
      data-surface="dark"
      className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col overflow-y-auto bg-chrome pt-8 text-chrome-fg lg:flex"
    >
      <div className="flex flex-col items-start gap-3 px-6">
        <Brand />
        <ConnectionStatus />
      </div>
      <nav aria-label="Navegación principal" className="mt-8 flex flex-1 flex-col">
        <ul>
          {mainNavItems.map((item) => (
            <li key={item.to}>
              <SidebarLink {...item} />
            </li>
          ))}
        </ul>
        <div className="mt-auto py-6">
          <SidebarLink {...settingsNavItem} />
        </div>
      </nav>
    </aside>
  )
}
