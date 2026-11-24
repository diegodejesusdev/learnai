import { Outlet, ScrollRestoration } from 'react-router'
import { Toaster } from '@/components/ui/Toaster'
import { ThemeSync } from '@/features/ajustes/ThemeSync'
import { ActiveTimerBanner } from '@/features/temporizador/ActiveTimerBanner'
import { ActiveTimerEffects } from '@/features/temporizador/ActiveTimerEffects'
import { BottomNav } from './BottomNav'
import { MobileHeader } from './MobileHeader'
import { Sidebar } from './Sidebar'

export function AppShell() {
  return (
    <div className="min-h-dvh">
      <a
        href="#contenido"
        className="sr-only z-50 rounded-control bg-hero px-4 py-3 font-semibold text-hero-fg focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Saltar al contenido
      </a>
      <Sidebar />
      <MobileHeader />
      <main id="contenido" className="lg:pl-60">
        <ActiveTimerBanner />
        {/* El padding inferior deja espacio para la barra de navegación del móvil. */}
        <div className="w-full max-w-6xl px-4 pt-8 pb-[calc(7rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-12 lg:pt-14 lg:pb-20">
          <Outlet />
        </div>
      </main>
      <BottomNav />
      <Toaster />
      <ActiveTimerEffects />
      <ThemeSync />
      <ScrollRestoration />
    </div>
  )
}
