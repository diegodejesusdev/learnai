import { ProgressBar } from '@/components/ui/ProgressBar'
import { Stat } from '@/components/ui/Stat'
import { formatDuration } from '@/lib/dates'

interface WeeklyGoalCardProps {
  minutes: number
  goalMinutes: number
  className?: string
}

export function WeeklyGoalCard({ minutes, goalMinutes, className }: WeeklyGoalCardProps) {
  const remaining = Math.max(0, goalMinutes - minutes)
  return (
    <Stat
      label="Meta semanal"
      className={className}
      value={
        <>
          {formatDuration(minutes)}{' '}
          <span className="text-lg leading-snug font-semibold tracking-tight whitespace-nowrap text-fg-muted [word-spacing:normal]">
            de {formatDuration(goalMinutes)}
          </span>
        </>
      }
      hint={
        remaining > 0
          ? `Te faltan ${formatDuration(remaining)} esta semana.`
          : '¡Meta cumplida esta semana!'
      }
    >
      <ProgressBar
        value={minutes / goalMinutes}
        label="Avance de la meta semanal"
        className="my-2"
      />
    </Stat>
  )
}
