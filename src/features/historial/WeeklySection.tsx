import { lazy, Suspense } from 'react'
import { Card } from '@/components/ui/Card'
import { ErrorState } from '@/components/ui/ErrorState'
import { LoadingState } from '@/components/ui/LoadingState'
import { Section } from '@/components/ui/Section'
import { useUserSettings } from '@/features/ajustes/useUserSettings'
import { formatDayKey, formatDuration } from '@/lib/dates'
import { recentWeeks } from '@/lib/studyStats'
import { ChartDataTable } from './ChartParts'
import { RECENT_WEEKS, todayKey, useWeekTotals } from './useStudyStats'

// Recharts se descarga solo al abrir el Historial.
const WeeklyMinutesChart = lazy(() =>
  import('./WeeklyMinutesChart').then((module) => ({ default: module.WeeklyMinutesChart })),
)

export function WeeklySection() {
  const today = todayKey()
  const weeks = useWeekTotals(today)
  const settings = useUserSettings()

  let content
  if (weeks.isError) {
    content = (
      <ErrorState title="No pudimos cargar tus semanas" onRetry={() => void weeks.refetch()} />
    )
  } else if (!weeks.data || !settings.data) {
    content = <LoadingState />
  } else {
    const rows = recentWeeks(weeks.data, today, RECENT_WEEKS).map((week) => ({
      label: formatDayKey(week.weekStart, 'd MMM'),
      minutes: week.minutes,
      isCurrent: week.isCurrent,
    }))
    const goal = settings.data.weekly_goal_minutes
    content = (
      <Card className="flex flex-col gap-2">
        <Suspense fallback={<div className="h-56" />}>
          <WeeklyMinutesChart rows={rows} goalMinutes={goal} />
        </Suspense>
        <ChartDataTable
          caption="Minutos por semana"
          columns={['Semana del', 'Tiempo']}
          rows={rows.map((row) => [
            row.isCurrent ? `${row.label} (esta semana)` : row.label,
            formatDuration(row.minutes),
          ])}
        />
      </Card>
    )
  }

  return (
    <Section
      title="Minutos por semana"
      description={`Últimas ${RECENT_WEEKS} semanas, de lunes a domingo, frente a tu meta.`}
    >
      {content}
    </Section>
  )
}
