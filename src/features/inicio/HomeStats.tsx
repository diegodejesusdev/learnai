import { ErrorState } from '@/components/ui/ErrorState'
import { Stat } from '@/components/ui/Stat'
import type { useStudySummary } from '@/features/historial/useStudyStats'
import { WeeklyGoalCard } from '@/features/historial/WeeklyGoalCard'
import { formatDuration } from '@/lib/dates'
import { formatDays, streakHint } from '@/lib/studyStats'

/** Minutos de hoy, racha y meta semanal, calculados en la base. */
export function HomeStats({ summary }: { summary: ReturnType<typeof useStudySummary> }) {
  if (summary.isError) {
    return <ErrorState title="No pudimos cargar tus totales" onRetry={summary.refetch} />
  }
  const data = summary.data
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-3 lg:gap-x-8 xl:grid-cols-1">
      <Stat
        label="Hoy"
        value={data ? formatDuration(data.todayMinutes) : '…'}
        hint={data && streakHint(data.streaks, data.todayMinutes, data.streakMinMinutes)}
      />
      <Stat
        label="Racha"
        value={data ? formatDays(data.streaks.current) : '…'}
        hint={data && `Máxima: ${formatDays(data.streaks.max)}`}
      />
      {data && (
        <WeeklyGoalCard
          minutes={data.weekMinutes}
          goalMinutes={data.weeklyGoalMinutes}
          className="col-span-2 lg:col-span-1"
        />
      )}
    </div>
  )
}
