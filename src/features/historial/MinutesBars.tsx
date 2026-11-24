import { lazy, Suspense } from 'react'
import { formatDuration } from '@/lib/dates'
import { ChartDataTable } from './ChartParts'
import { MINUTES_ROW_HEIGHT } from './chartScale'

const MinutesBarChart = lazy(() =>
  import('./MinutesBarChart').then((module) => ({ default: module.MinutesBarChart })),
)

export interface MinutesRow {
  label: string
  title: string
  /** En la tabla: puede llevar más detalle que la etiqueta del eje. */
  name: string
  minutes: number
  sessions: number
}

interface MinutesBarsProps {
  caption: string
  /** Encabezado de la primera columna de la tabla. */
  column: string
  rows: readonly MinutesRow[]
}

/** Barras de minutos con su tabla «Ver los datos». Recharts se descarga solo aquí. */
export function MinutesBars({ caption, column, rows }: MinutesBarsProps) {
  return (
    <>
      <Suspense fallback={<div style={{ height: rows.length * MINUTES_ROW_HEIGHT }} />}>
        <MinutesBarChart rows={rows} />
      </Suspense>
      <ChartDataTable
        caption={caption}
        columns={[column, 'Tiempo', 'Sesiones']}
        rows={rows.map((row) => [row.name, formatDuration(row.minutes), String(row.sessions)])}
      />
    </>
  )
}
