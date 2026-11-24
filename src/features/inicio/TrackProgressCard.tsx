import { ChevronRight, Route } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { CardLink } from '@/components/ui/CardLink'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { totalProgress } from '@/lib/progress'
import { topicStatuses } from '@/features/ruta/progressModel'
import type { TrackData } from '@/features/ruta/RoadmapGate'

/** Progreso de una ruta. Al tocarla se abre en Ruta (y queda como la activa). */
export function TrackProgressCard({ track, progress, active }: TrackData & { active: boolean }) {
  const total = totalProgress(track.phases, topicStatuses(progress))
  return (
    <CardLink to={`/ruta?ruta=${track.id}`} className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 flex-wrap items-center gap-2 text-sm text-fg-muted">
          <Route className="size-4 shrink-0 text-accent" />
          {track.title}
          {active && <Badge tone="accent">Activa</Badge>}
        </span>
        <ChevronRight className="size-5 shrink-0 text-fg-muted" />
      </div>
      <p className="text-lg font-semibold">
        {total.done}{' '}
        <span className="font-normal text-fg-muted">de {total.total} temas hechos</span>
      </p>
      <ProgressBar value={total.ratio} label={`Progreso de ${track.title}`} showLabel />
    </CardLink>
  )
}
