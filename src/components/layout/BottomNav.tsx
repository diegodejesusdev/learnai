import { NavLink } from 'react-router'
import { cn } from '@/lib/cn'
import { mainNavItems } from './navItems'

/** Navegación del móvil: fija abajo y respetando el área segura del iPhone. */
export function BottomNav() {
  return (
    <nav
      aria-label="Navegación principal"
      data-surface="dark"
      className="keyboard-hidden fixed inset-x-0 bottom-0 z-30 bg-chrome pb-[env(safe-area-inset-bottom)] text-chrome-fg lg:hidden"
    >
      <ul className="grid grid-cols-5 gap-1 px-1.5 py-1.5">
        {mainNavItems.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex min-h-13 flex-col items-center justify-center gap-0.5 rounded-control text-xs font-semibold transition-colors focus-visible:-outline-offset-2',
                  isActive ? 'bg-hero text-hero-fg' : 'text-chrome-muted hover:text-chrome-fg',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="size-6" strokeWidth={isActive ? 2.5 : 1.75} />
                  {label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
