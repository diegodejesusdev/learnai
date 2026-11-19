import { Settings } from 'lucide-react'
import { NavLink } from 'react-router'
import { cn } from '@/lib/cn'
import { Brand } from './Brand'

/** Cabecera del móvil con acceso a Ajustes (en escritorio está en la barra lateral). */
export function MobileHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-bg/90 pt-[env(safe-area-inset-top)] backdrop-blur lg:hidden">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        <Brand />
        <NavLink
          to="/ajustes"
          aria-label="Ajustes"
          className={({ isActive }) =>
            cn(
              'flex size-11 items-center justify-center rounded-xl transition-colors hover:bg-surface-muted',
              isActive ? 'text-accent' : 'text-fg-muted',
            )
          }
        >
          <Settings className="size-6" />
        </NavLink>
      </div>
    </header>
  )
}
