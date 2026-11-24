import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatDuration } from '@/lib/dates'
import { ChartTooltipBox } from './ChartParts'
import { axisTick, MINUTES_ROW_HEIGHT } from './chartScale'

export interface MinutesBarRow {
  /** En el eje: «Fase 1» o el nombre de la ruta. */
  label: string
  /** En el tooltip. */
  title: string
  minutes: number
}

interface MinutesBarChartProps {
  rows: readonly MinutesBarRow[]
  /** Ancho del eje; si la etiqueta no cabe, se parte en dos líneas. */
  labelWidth?: number
}

// 68: «Fase 12» en una sola línea (Recharts mide el texto con el tamaño de letra de la página).
const PHASE_LABEL_WIDTH = 68

/** Barras horizontales de minutos (por fase o por ruta), con el tiempo al final de cada barra. */
export function MinutesBarChart({ rows, labelWidth = PHASE_LABEL_WIDTH }: MinutesBarChartProps) {
  const height = rows.length * MINUTES_ROW_HEIGHT
  return (
    <ResponsiveContainer width="100%" height={height} initialDimension={{ width: 320, height }}>
      <BarChart
        layout="vertical"
        data={[...rows]}
        margin={{ top: 0, right: 84, bottom: 0, left: 0 }}
        barCategoryGap={8}
      >
        <XAxis type="number" hide domain={[0, (dataMax: number) => Math.max(dataMax, 1)]} />
        <YAxis
          type="category"
          dataKey="label"
          width={labelWidth}
          tickLine={false}
          axisLine={false}
          tick={axisTick}
        />
        <Tooltip
          cursor={{ fill: 'var(--surface-muted)' }}
          content={({ active, label }) => {
            const row = rows.find((candidate) => candidate.label === label)
            if (!active || !row) return null
            return <ChartTooltipBox value={formatDuration(row.minutes)} label={row.title} />
          }}
        />
        <Bar dataKey="minutes" fill="var(--accent)" radius={[0, 4, 4, 0]} maxBarSize={20}>
          <LabelList
            dataKey="minutes"
            position="right"
            formatter={(value) =>
              typeof value === 'number' && value > 0 ? formatDuration(value) : ''
            }
            fill="var(--fg-muted)"
            fontSize={12}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
