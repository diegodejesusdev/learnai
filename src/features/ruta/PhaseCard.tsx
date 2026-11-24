import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { rowClasses } from '@/components/ui/styles'
import { cn } from '@/lib/cn'
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

/** Una fase en la lista: su número en grande, cuánto llevas y su estado. */
export function PhaseCard({ phase, progress, status }: PhaseCardProps) {
  return (
    <Link
      to={`/ruta/${phase.id}`}
      className={cn(rowClasses, 'group flex items-start gap-4 py-5 sm:gap-6')}
    >
      <span
        aria-hidden
        className={cn(
          'w-11 shrink-0 text-figure sm:w-16',
          status === 'en_curso' ? 'text-meter' : status === 'hecho' ? 'text-fg' : 'text-control',
        )}
      >
        {phase.order}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1 pt-0.5">
        <p className="sr-only">{phaseLabel(phase)}</p>
        <h3 className="text-title group-hover:text-accent">{phase.title}</h3>
        <p className="hidden max-w-2xl text-sm text-fg-muted sm:line-clamp-2">{phase.summary}</p>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-fg-muted tabular-nums">
          <span>{weeksLabel(phase.estimated_weeks)}</span>
          <span>
            {progress.done}/{progress.total} temas
          </span>
          <StatusBadge status={status} />
        </p>
        {status === 'en_curso' && (
          <ProgressBar
            value={progress.ratio}
            label={`Progreso de ${phase.title}`}
            className="mt-2"
          />
        )}
      </div>
      <ArrowRight className="mt-1.5 size-6 shrink-0 text-fg-muted transition-transform group-hover:translate-x-1 group-hover:text-accent" />
    </Link>
  )
}
