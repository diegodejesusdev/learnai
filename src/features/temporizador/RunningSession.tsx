import { Flag, Pause, Play, Sun } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { unlockAudio } from '@/lib/alerts'
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
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col items-center gap-3 py-8 text-center">
        <p className="text-sm text-fg-muted">{context}</p>
        <h2 className="text-lg font-semibold text-balance">{title}</h2>
        <div className="flex flex-wrap justify-center gap-2">
          <Badge tone={view.phaseLabel === 'Descanso' ? 'done' : 'accent'}>{view.phaseLabel}</Badge>
          {view.paused && <Badge tone="progress">En pausa</Badge>}
        </div>
        <p
          className="text-7xl font-semibold tracking-tight tabular-nums sm:text-8xl"
          role="timer"
          aria-label={`${view.phaseLabel}: ${view.clock}${view.paused ? ', en pausa' : ''}`}
        >
          {view.clock}
        </p>
        {view.blockProgress !== null && (
          <ProgressBar
            value={view.blockProgress}
            label="Avance del bloque"
            size="sm"
            className="w-full max-w-xs"
          />
        )}
        <p className="text-sm text-fg-muted">
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
      </Card>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button size="lg" onClick={togglePause} disabled={change.isPending}>
          {view.paused ? <Play className="size-5" /> : <Pause className="size-5" />}
          {view.paused ? 'Reanudar' : 'Pausar'}
        </Button>
        <Button size="lg" variant="secondary" onClick={onFinish}>
          <Flag className="size-5" />
          Terminar
        </Button>
      </div>
      {isWakeLockSupported() && !view.paused && (
        <p className="flex items-center gap-2 text-sm text-fg-muted">
          <Sun className="size-4 text-accent" />
          La pantalla se mantiene encendida mientras corre el temporizador.
        </p>
      )}
      {timer.mode === 'pomodoro' && <NotificationToggle />}
    </div>
  )
}
