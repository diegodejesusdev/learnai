import { PartyPopper, Play } from 'lucide-react'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { EmptyState } from '@/components/ui/EmptyState'
import { Hero } from '@/components/ui/Hero'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { statusLabels } from '@/lib/labels'
import { nextTopic, statusOf } from '@/lib/progress'
import { phaseLabel, trackPhaseLabel } from '@/lib/roadmap'
import { topicStatuses } from './progressModel'
import type { TrackData } from './RoadmapGate'

interface NextTopicCardProps extends TrackData {
  /** Fuera de la página de la ruta: dice de qué ruta es y va en una fila, sin el bloque grande. */
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
  const status = statusOf(statuses, topic.id)

  if (showTrack) {
    return (
      <section className="flex flex-col gap-4 border-t-2 border-fg py-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-sm text-fg-muted">
            Siguiente tema · {trackPhaseLabel(track, phase)}: {phase.title}
          </p>
          <h2 className="text-title">{topic.title}</h2>
          <StatusBadge status={status} />
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <ButtonLink to={`/estudiar?tema=${topic.id}`}>
            <Play className="size-4 fill-current" />
            Estudiar este tema
          </ButtonLink>
          <ButtonLink to={`/ruta/tema/${topic.id}`} variant="secondary">
            Ver tema
          </ButtonLink>
        </div>
      </section>
    )
  }

  return (
    <Hero className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-hero-muted">
          Siguiente tema · {phaseLabel(phase)}: {phase.title}
        </p>
        <h2 className="text-lead text-balance wrap-break-word hyphens-auto">{topic.title}</h2>
        <p className="max-w-xl text-pretty text-hero-muted">{topic.details}</p>
        <p className="text-sm font-semibold">{statusLabels[status]}</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <ButtonLink to={`/estudiar?tema=${topic.id}`} variant="inverse" size="lg">
          <Play className="size-5 fill-current" />
          Estudiar este tema
        </ButtonLink>
        <ButtonLink to={`/ruta/tema/${topic.id}`} variant="outline" size="lg">
          Ver tema
        </ButtonLink>
      </div>
    </Hero>
  )
}
