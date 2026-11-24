import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { formatDayKey, formatDuration } from '@/lib/dates'
import type { DayTotal } from '@/lib/studyStats'
import type { Track } from '@/lib/roadmap'
import { SessionRow } from './SessionRow'
import { useDaySessions } from './useSessions'

interface DayDetailProps {
  day: string
  today: string
  total: DayTotal | undefined
  minMinutes: number
  tracks: readonly Track[]
}

function dayTitle(day: string, today: string): string {
  const sameYear = day.slice(0, 4) === today.slice(0, 4)
  const text = formatDayKey(day, sameYear ? "EEEE, d 'de' MMMM" : "EEEE, d 'de' MMMM 'de' yyyy")
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** El día elegido en el mapa de calor: sus minutos, si cuenta para la racha y sus sesiones. */
export function DayDetail({ day, today, total, minMinutes, tracks }: DayDetailProps) {
  const minutes = total?.minutes ?? 0
  const sessions = useDaySessions(day, minutes > 0)

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-5 wide:border-t-0 wide:pt-0">
      <div aria-live="polite" className="flex flex-col gap-0.5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <h3 className="text-lg font-bold tracking-tight">{dayTitle(day, today)}</h3>
          {minutes > 0 && (
            <span className="text-lg font-bold tabular-nums">{formatDuration(minutes)}</span>
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
          <ul
            aria-label="Sesiones del día"
            className="divide-y divide-border border-y border-border"
          >
            {sessions.data.map((session) => (
              <li key={session.id}>
                <SessionRow session={session} tracks={tracks} showDate={false} />
              </li>
            ))}
          </ul>
        ) : (
          <Spinner className="text-meter" />
        ))}
    </div>
  )
}
