import { ProgressBar } from '@/components/ui/ProgressBar'
import { formatDuration } from '@/lib/dates'
import { ChartDataTable } from './ChartParts'
import type { TrackTotal } from './trackTotals'

/** Barras de minutos por ruta con el nombre completo encima, y su tabla «Ver los datos». */
export function TrackMinutes({ totals }: { totals: readonly TrackTotal[] }) {
  const max = Math.max(1, ...totals.map(({ minutes }) => minutes))
  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-6">
        {totals.map(({ track, minutes }) => (
          <li key={track.id} className="flex flex-col gap-2">
            <p className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between">
              <span className="font-semibold">{track.title}</span>
              <span className="text-title">{formatDuration(minutes)}</span>
            </p>
            <ProgressBar value={minutes / max} label={`Tiempo en ${track.title}`} tone="accent" />
          </li>
        ))}
      </ul>
      <ChartDataTable
        caption="Minutos por ruta"
        columns={['Ruta', 'Tiempo', 'Sesiones']}
        rows={totals.map(({ track, minutes, sessions }) => [
          track.title,
          formatDuration(minutes),
          String(sessions),
        ])}
      />
    </div>
  )
}
