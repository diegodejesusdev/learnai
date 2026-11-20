import { ChevronRight, Hourglass, Pause, Timer } from 'lucide-react'
import { Link, useLocation } from 'react-router'
import { useRoadmap } from '@/features/ruta/useRoadmap'
import { useNow } from '@/lib/useNow'
import { targetTitle } from './studyTargets'
import { timerView } from './timerView'
import { useActiveTimer } from './useActiveTimer'

/** Banner pequeño con la sesión en curso, en todas las páginas menos Estudiar. */
export function ActiveTimerBanner() {
  const { pathname } = useLocation()
  const { data: timer } = useActiveTimer()
  const now = useNow(Boolean(timer && timer.pausedAt === null))
  const phases = useRoadmap().data?.phases ?? []

  if (!timer || pathname.startsWith('/estudiar')) return null

  const view = timerView(timer, now)
  const Icon = view.paused ? Pause : timer.mode === 'pomodoro' ? Timer : Hourglass
  const title = targetTitle(phases, timer) ?? 'Sesión de estudio'

  return (
    <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-10 border-b border-border bg-accent-soft lg:top-0">
      <Link
        to="/estudiar"
        aria-label={`Sesión en curso: ${title}. ${view.phaseLabel} ${view.clock}${view.paused ? ', en pausa' : ''}. Abrir el temporizador.`}
        className="mx-auto flex min-h-11 max-w-3xl items-center gap-3 px-4 py-2 text-accent-soft-fg sm:px-6 lg:px-8"
      >
        <Icon className="size-5 shrink-0" />
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{title}</span>
        <span className="shrink-0 text-xs">{view.paused ? 'En pausa' : view.phaseLabel}</span>
        <span className="shrink-0 font-semibold tabular-nums">{view.clock}</span>
        <ChevronRight className="size-4 shrink-0" />
      </Link>
    </div>
  )
}
