import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { rowClasses } from '@/components/ui/styles'
import { cn } from '@/lib/cn'
import { totalProgress } from '@/lib/progress'
import { topicStatuses } from '@/features/ruta/progressModel'
import type { TrackData } from '@/features/ruta/RoadmapGate'

/** Progreso de una ruta. Al tocarla se abre en Ruta (y queda como la activa). */
export function TrackProgressCard({ track, progress, active }: TrackData & { active: boolean }) {
  const total = totalProgress(track.phases, topicStatuses(progress))
  return (
    <Link
      to={`/ruta?ruta=${track.id}`}
      className={cn(rowClasses, 'group flex flex-col gap-4 py-6')}
    >
      <div className="flex items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col items-start gap-1">
          {active && <Badge tone="accent">Activa</Badge>}
          <span className="text-title group-hover:text-accent">{track.title}</span>
          <span className="text-sm text-fg-muted tabular-nums">
            {total.done} de {total.total} temas hechos
          </span>
        </div>
        <span
          aria-hidden
          className="flex shrink-0 items-center gap-3 text-figure whitespace-nowrap"
        >
          {Math.round(total.ratio * 100)} %
          <ArrowRight className="size-6 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
      <ProgressBar value={total.ratio} label={`Progreso de ${track.title}`} />
    </Link>
  )
}
