import { Settings } from 'lucide-react'
import { NavLink } from 'react-router'
import { cn } from '@/lib/cn'
import { Brand } from './Brand'
import { ConnectionStatus } from './ConnectionStatus'

/** Cabecera del móvil con acceso a Ajustes (en escritorio está en la barra lateral). */
export function MobileHeader() {
  return (
    <header
      data-surface="dark"
      className="sticky top-0 z-20 bg-chrome pt-[env(safe-area-inset-top)] text-chrome-fg lg:hidden"
    >
      <div className="flex h-14 items-center gap-2 pr-2 pl-4 sm:pr-4 sm:pl-6">
        <Brand />
        <ConnectionStatus className="ml-auto" />
        <NavLink
          to="/ajustes"
          aria-label="Ajustes"
          className={({ isActive }) =>
            cn(
              'flex size-11 shrink-0 items-center justify-center rounded-control transition-colors focus-visible:-outline-offset-2',
              isActive ? 'bg-hero text-hero-fg' : 'text-chrome-muted hover:text-chrome-fg',
            )
          }
        >
          <Settings className="size-6" />
        </NavLink>
      </div>
    </header>
  )
}
