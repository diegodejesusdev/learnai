import { ChevronRight, Hourglass, Pause, Timer } from 'lucide-react'
import { Link, useLocation } from 'react-router'
import { useRoadmap } from '@/features/ruta/useRoadmap'
import { cn } from '@/lib/cn'
import { useNow } from '@/lib/useNow'
import { targetTitle } from './studyTargets'
import { timerView } from './timerView'
import { useActiveTimer } from './useActiveTimer'

// En el PC, cada texto va en su píldora. En el móvil los grupos no existen («contents») y la
// barra es una sola franja.
const pill =
  'lg:inline-flex lg:min-h-10 lg:items-center lg:gap-2.5 lg:rounded-full lg:bg-hero lg:px-4 lg:text-hero-fg'

/** Banner pequeño con la sesión en curso, en todas las páginas menos Estudiar. */
export function ActiveTimerBanner() {
  const { pathname } = useLocation()
  const { data: timer } = useActiveTimer()
  const now = useNow(Boolean(timer && timer.pausedAt === null))
  const tracks = useRoadmap().data?.tracks ?? []

  if (!timer || pathname.startsWith('/estudiar')) return null

  const view = timerView(timer, now)
  const Icon = view.paused ? Pause : timer.mode === 'pomodoro' ? Timer : Hourglass
  const title = targetTitle(tracks, timer) ?? 'Sesión de estudio'

  return (
    <div
      data-surface="dark"
      data-timer-banner
      className="timer-banner sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-10 text-hero-fg lg:top-0"
    >
      <Link
        to="/estudiar"
        aria-label={`Sesión en curso: ${title}. ${view.phaseLabel} ${view.clock}${view.paused ? ', en pausa' : ''}. Abrir el temporizador.`}
        className="flex min-h-12 items-center gap-3 px-4 py-2 focus-visible:-outline-offset-4 sm:px-6 lg:min-h-16 lg:max-w-[100rem] lg:gap-2 lg:px-12 lg:focus-visible:outline-accent 3xl:px-16"
      >
        <span className={cn('contents lg:mr-auto lg:min-w-0', pill)}>
          <Icon className="size-5 shrink-0" />
          <span className="min-w-0 flex-1 truncate text-sm font-semibold">{title}</span>
        </span>
        <span className={cn('shrink-0 text-sm text-hero-muted lg:font-semibold', pill)}>
          {view.paused ? 'En pausa' : view.phaseLabel}
        </span>
        <span className={cn('contents', pill)}>
          <span className="shrink-0 text-lg font-extrabold tabular-nums">{view.clock}</span>
          <ChevronRight className="size-4 shrink-0" />
        </span>
      </Link>
    </div>
  )
}
