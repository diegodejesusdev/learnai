import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatDuration } from '@/lib/dates'
import { ChartTooltipBox } from './ChartParts'
import { axisTick } from './chartScale'

export interface PhaseChartRow {
  /** 'Fase 1'. */
  label: string
  title: string
  minutes: number
}

const ROW_HEIGHT = 36

/** Barras horizontales de minutos por fase, con el tiempo al final de cada barra. */
export function PhaseMinutesChart({ rows }: { rows: readonly PhaseChartRow[] }) {
  const height = rows.length * ROW_HEIGHT
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
          width={52}
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
