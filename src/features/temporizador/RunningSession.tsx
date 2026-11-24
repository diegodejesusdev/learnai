import { Flag, Pause, Play, Sun } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Hero } from '@/components/ui/Hero'
import { unlockAudio } from '@/lib/alerts'
import { cn } from '@/lib/cn'
import { formatDuration } from '@/lib/dates'
import { useNow } from '@/lib/useNow'
import { isWakeLockSupported } from '@/lib/useWakeLock'
import { NotificationToggle } from './NotificationToggle'
import { pause, resume, type ActiveTimer } from './timerModel'
import { timerView } from './timerView'
import { useTimerChange } from './useActiveTimer'

interface RunningSessionProps {
  timer: ActiveTimer
  title: string
  context: string
  onFinish: () => void
}

export function RunningSession({ timer, title, context, onFinish }: RunningSessionProps) {
  const now = useNow(timer.pausedAt === null)
  const view = timerView(timer, now)
  const change = useTimerChange()

  function togglePause() {
    if (view.paused) {
      unlockAudio()
      change.mutate({ kind: 'update', timer: resume(timer, new Date()) })
    } else {
      change.mutate({ kind: 'update', timer: pause(timer, new Date()) })
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* El fondo dice de lejos si corre (vinotinto) o está en pausa (negro). */}
      <Hero
        tone={view.paused ? 'chrome' : 'hero'}
        className="-mt-4 flex min-h-[25rem] flex-col justify-between gap-8 lg:mt-0 lg:min-h-[32rem]"
      >
        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-medium text-hero-muted">{context}</p>
          <h2 className="text-title text-balance">{title}</h2>
        </div>
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap gap-x-4 text-lg font-bold">
            <span>{view.phaseLabel}</span>
            {view.paused && <span className="text-hero-muted">En pausa</span>}
          </div>
          <p
            className={cn(
              'leading-[0.8] font-extrabold tracking-[-0.045em] tabular-nums',
              // Con horas («1:05:32») son más cifras: más pequeño para que quepa a 360 px.
              view.clock.length > 5
                ? 'text-[clamp(4rem,20vw,9rem)] lg:text-[clamp(6rem,11vw,10rem)]'
                : 'text-[clamp(5.5rem,28vw,13rem)] lg:text-[clamp(8rem,15vw,13rem)]',
            )}
            role="timer"
            aria-label={`${view.phaseLabel}: ${view.clock}${view.paused ? ', en pausa' : ''}`}
          >
            {view.clock}
          </p>
          {view.blockProgress !== null && (
            <div
              role="progressbar"
              aria-label="Avance del bloque"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(view.blockProgress * 100)}
              className="h-2.5 overflow-hidden bg-hero-fg/25"
            >
              <div
                className="h-full origin-left bg-hero-fg transition-transform duration-500"
                style={{ transform: `scaleX(${view.blockProgress})` }}
              />
            </div>
          )}
        </div>
        <p className="text-sm text-hero-muted">
          {view.pomodoro && (
            <>
              Ciclo {view.pomodoro.cycle} · {view.pomodoro.completedCycles}{' '}
              {view.pomodoro.completedCycles === 1 ? 'ciclo completado' : 'ciclos completados'}{' '}
              ·{' '}
            </>
          )}
          <span className="whitespace-nowrap">
            Estudiado: {formatDuration(view.focusSeconds / 60)}
          </span>
        </p>
      </Hero>
      <div className="grid grid-cols-2 gap-3">
        <Button size="xl" onClick={togglePause} disabled={change.isPending}>
          {view.paused ? (
            <Play className="size-6 fill-current" />
          ) : (
            <Pause className="size-6 fill-current" />
          )}
          {view.paused ? 'Reanudar' : 'Pausar'}
        </Button>
        <Button size="xl" variant="secondary" onClick={onFinish}>
          <Flag className="size-6" />
          Terminar
        </Button>
      </div>
      {isWakeLockSupported() && !view.paused && (
        <p className="flex items-center gap-2 text-sm text-fg-muted">
          <Sun className="size-4 shrink-0" />
          La pantalla se mantiene encendida mientras corre el temporizador.
        </p>
      )}
      {timer.mode === 'pomodoro' && <NotificationToggle />}
    </div>
  )
}
