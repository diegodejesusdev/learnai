import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatDuration } from '@/lib/dates'
import { ChartTooltipBox } from './ChartParts'
import { axisTick, hourTicks } from './chartScale'

export interface WeeklyChartRow {
  /** '16 nov' (el lunes de la semana). */
  label: string
  minutes: number
  isCurrent: boolean
}

interface WeeklyMinutesChartProps {
  rows: readonly WeeklyChartRow[]
  goalMinutes: number
}

/** Columnas de minutos por semana con una línea en la meta semanal. */
export function WeeklyMinutesChart({ rows, goalMinutes }: WeeklyMinutesChartProps) {
  const ticks = hourTicks(Math.max(goalMinutes, ...rows.map((row) => row.minutes)))
  return (
    <div className="h-64">
      <ResponsiveContainer
        width="100%"
        height="100%"
        initialDimension={{ width: 320, height: 256 }}
      >
        <BarChart data={[...rows]} margin={{ top: 20, right: 4, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={axisTick}
            interval="preserveStartEnd"
            minTickGap={12}
          />
          <YAxis
            ticks={ticks}
            domain={[0, ticks.at(-1) ?? 60]}
            tickFormatter={(minutes: number) => `${minutes / 60} h`}
            width={36}
            tickLine={false}
            axisLine={false}
            tick={axisTick}
          />
          <Tooltip
            cursor={{ fill: 'var(--surface-muted)' }}
            content={({ active, label }) => {
              const row = rows.find((candidate) => candidate.label === label)
              if (!active || !row) return null
              return (
                <ChartTooltipBox
                  value={formatDuration(row.minutes)}
                  label={row.isCurrent ? 'Esta semana' : `Semana del ${row.label}`}
                />
              )
            }}
          />
          {goalMinutes > 0 && (
            <ReferenceLine
              y={goalMinutes}
              stroke="var(--fg)"
              strokeDasharray="4 4"
              label={{
                value: `Meta: ${formatDuration(goalMinutes)}`,
                position: 'insideTopLeft',
                fill: 'var(--fg-muted)',
                fontSize: 13,
              }}
            />
          )}
          <Bar dataKey="minutes" fill="var(--meter)" radius={[6, 6, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
