import { Card } from '@/components/ui/Card'

interface TimerPreviewProps {
  mode: 'pomodoro' | 'free'
  workMinutes: number
  breakMinutes: number
}

/** Solo visual en la fase 1: el cálculo real desde la hora de inicio llega en la fase 4. */
export function TimerPreview({ mode, workMinutes, breakMinutes }: TimerPreviewProps) {
  const display = mode === 'pomodoro' ? `${String(workMinutes).padStart(2, '0')}:00` : '00:00'
  const caption =
    mode === 'pomodoro'
      ? `Bloque de trabajo · ${workMinutes} min de trabajo, ${breakMinutes} de descanso`
      : 'Cronómetro libre · se detiene cuando tú quieras'

  return (
    <Card className="flex flex-col items-center gap-2 py-10">
      <p
        className="text-7xl font-semibold tracking-tight tabular-nums sm:text-8xl"
        aria-label={`Tiempo: ${display}`}
      >
        {display}
      </p>
      <p className="text-center text-sm text-fg-muted">{caption}</p>
    </Card>
  )
}
