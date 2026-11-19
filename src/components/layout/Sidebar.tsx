import { NavLink } from 'react-router'
import { cn } from '@/lib/cn'
import { Brand } from './Brand'
import { mainNavItems, settingsNavItem, type NavItem } from './navItems'

function SidebarLink({ to, label, icon: Icon, end }: NavItem) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors',
          isActive
            ? 'bg-accent-soft text-accent-soft-fg'
            : 'text-fg-muted hover:bg-surface-muted hover:text-fg',
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
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-surface px-3 py-5 lg:flex">
      <div className="px-2">
        <Brand />
      </div>
      <nav aria-label="Navegación principal" className="mt-6 flex flex-1 flex-col">
        <ul className="flex flex-col gap-1">
          {mainNavItems.map((item) => (
            <li key={item.to}>
              <SidebarLink {...item} />
            </li>
          ))}
        </ul>
        <div className="mt-auto border-t border-border pt-3">
          <SidebarLink {...settingsNavItem} />
        </div>
      </nav>
    </aside>
  )
}
