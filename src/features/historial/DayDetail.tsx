import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { formatDayKey, formatDuration } from '@/lib/dates'
import type { DayTotal } from '@/lib/studyStats'
import type { Phase } from '@/types/curriculum'
import { SessionRow } from './SessionRow'
import { useDaySessions } from './useSessions'

interface DayDetailProps {
  day: string
  today: string
  total: DayTotal | undefined
  minMinutes: number
  phases: readonly Phase[]
}

function dayTitle(day: string, today: string): string {
  const sameYear = day.slice(0, 4) === today.slice(0, 4)
  const text = formatDayKey(day, sameYear ? "EEEE, d 'de' MMMM" : "EEEE, d 'de' MMMM 'de' yyyy")
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** El día elegido en el mapa de calor: sus minutos, si cuenta para la racha y sus sesiones. */
export function DayDetail({ day, today, total, minMinutes, phases }: DayDetailProps) {
  const minutes = total?.minutes ?? 0
  const sessions = useDaySessions(day, minutes > 0)

  return (
    <Card className="flex flex-col gap-3">
      <div aria-live="polite" className="flex flex-col gap-0.5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <h3 className="font-semibold">{dayTitle(day, today)}</h3>
          {minutes > 0 && (
            <span className="text-sm font-medium tabular-nums">{formatDuration(minutes)}</span>
          )}
        </div>
        <p className="text-sm text-fg-muted">
          {minutes === 0
            ? 'No hay sesiones este día.'
            : minutes >= minMinutes
              ? 'Cuenta para la racha.'
              : `No llega al mínimo de ${formatDuration(minMinutes)} para la racha.`}
        </p>
      </div>
      {minutes > 0 &&
        (sessions.isError ? (
          <div className="flex items-center justify-between gap-3 text-sm text-danger">
            No se pudieron cargar las sesiones.
            <Button variant="secondary" onClick={() => void sessions.refetch()}>
              Reintentar
            </Button>
          </div>
        ) : sessions.data ? (
          <ul aria-label="Sesiones del día" className="-mx-2 divide-y divide-border">
            {sessions.data.map((session) => (
              <li key={session.id}>
                <SessionRow session={session} phases={phases} showDate={false} />
              </li>
            ))}
          </ul>
        ) : (
          <Spinner className="text-accent" />
        ))}
    </Card>
  )
}
