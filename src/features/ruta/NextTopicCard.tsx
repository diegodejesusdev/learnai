import { PartyPopper, Play } from 'lucide-react'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { nextTopic, statusOf } from '@/lib/progress'
import { phaseLabel, trackPhaseLabel } from '@/lib/roadmap'
import { topicStatuses } from './progressModel'
import type { TrackData } from './RoadmapGate'

interface NextTopicCardProps extends TrackData {
  /** Fuera de la página de la ruta: dice de qué ruta es. */
  showTrack?: boolean
}

/** Sugerencia de una ruta: el primer tema en curso o, si no hay, el primer pendiente. */
export function NextTopicCard({ track, progress, showTrack = false }: NextTopicCardProps) {
  const statuses = topicStatuses(progress)
  const next = nextTopic(track.phases, statuses)

  // Una ruta sin contenido todavía (seed a medias) no está terminada.
  if (track.phases.length === 0) return null

  if (!next) {
    return (
      <EmptyState
        icon={PartyPopper}
        title={`Completaste todos los temas de «${track.title}»`}
        description="Revisa los proyectos y la checklist final."
      />
    )
  }

  const { topic, phase } = next
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-fg-muted">
          Siguiente tema · {showTrack ? trackPhaseLabel(track, phase) : phaseLabel(phase)}:{' '}
          {phase.title}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-semibold tracking-tight">{topic.title}</h2>
          <StatusBadge status={statusOf(statuses, topic.id)} />
        </div>
        <p className="text-sm text-fg-muted">{topic.details}</p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <ButtonLink to={`/estudiar?tema=${topic.id}`} size="lg" className="sm:flex-1">
          <Play className="size-5" />
          Estudiar este tema
        </ButtonLink>
        <ButtonLink to={`/ruta/tema/${topic.id}`} variant="secondary" size="lg">
          Ver tema
        </ButtonLink>
      </div>
    </Card>
  )
}
