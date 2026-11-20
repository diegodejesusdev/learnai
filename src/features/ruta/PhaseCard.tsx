import { ChevronRight } from 'lucide-react'
import { CardLink } from '@/components/ui/CardLink'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { Progress } from '@/lib/progress'
import { phaseLabel } from '@/lib/roadmap'
import type { Phase } from '@/types/curriculum'
import type { ProgressStatus } from '@/types/progress'

function weeksLabel(weeks: number): string {
  return weeks === 1 ? '1 semana' : `${weeks} semanas`
}

interface PhaseCardProps {
  phase: Phase
  progress: Progress
  status: ProgressStatus
}

export function PhaseCard({ phase, progress, status }: PhaseCardProps) {
  return (
    <CardLink to={`/ruta/${phase.id}`} className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-sm font-medium text-accent">
            {phaseLabel(phase)} · {weeksLabel(phase.estimated_weeks)}
          </p>
          <h3 className="font-semibold">{phase.title}</h3>
          <p className="line-clamp-2 text-sm text-fg-muted">{phase.summary}</p>
        </div>
        <ChevronRight className="mt-1 size-5 shrink-0 text-fg-muted" />
      </div>
      <div className="flex items-center gap-3">
        <ProgressBar
          value={progress.ratio}
          label={`Progreso de ${phase.title}`}
          size="sm"
          className="flex-1"
        />
        <span className="text-xs text-fg-muted tabular-nums">
          {progress.done}/{progress.total} temas
        </span>
        <StatusBadge status={status} />
      </div>
    </CardLink>
  )
}
