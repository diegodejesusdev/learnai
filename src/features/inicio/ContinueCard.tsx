import { Play } from 'lucide-react'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { Hero } from '@/components/ui/Hero'
import { formatRelativeDay, toDayKey } from '@/lib/dates'
import { statusLabels } from '@/lib/labels'
import { statusOf } from '@/lib/progress'
import { findPhaseIn, findTopicIn, trackOfTarget, trackPhaseLabel, type Track } from '@/lib/roadmap'
import type { StatusMap } from '@/types/progress'
import type { ContinueSuggestion } from './continueStudying'

interface ContinueCardProps {
  suggestion: ContinueSuggestion
  tracks: readonly Track[]
  topicStatuses: StatusMap
  /** Sin ninguna sesión todavía, el botón dice «Empezar a estudiar». */
  hasHistory: boolean
}

function contextOf(suggestion: ContinueSuggestion, where: string): string {
  if (suggestion.kind === 'timer') return `Tienes una sesión en curso · ${where}`
  if (suggestion.kind === 'last' && suggestion.lastStartedAt) {
    const day = formatRelativeDay(toDayKey(suggestion.lastStartedAt), toDayKey(new Date()))
    return `Tu última sesión, ${day} · ${where}`
  }
  return `Siguiente tema · ${where}`
}

/** La tarjeta principal de Inicio: qué estudiar ahora y el botón «Seguir estudiando». */
export function ContinueCard({ suggestion, tracks, topicStatuses, hasHistory }: ContinueCardProps) {
  const track = trackOfTarget(tracks, suggestion.target)
  const phases = track?.phases ?? []
  const { topicId, projectPhaseId } = suggestion.target
  const topic = topicId !== null ? findTopicIn(phases, topicId) : undefined
  const phase = topic?.phase ?? findPhaseIn(phases, projectPhaseId ?? undefined)
  const title = topic?.topic.title ?? phase?.project.title ?? 'Tu sesión'
  const where =
    track && phase
      ? topic
        ? `${trackPhaseLabel(track, phase)}: ${phase.title}`
        : `Proyecto · ${trackPhaseLabel(track, phase)}`
      : ''
  const detailsUrl = topic ? `/ruta/tema/${topic.topic.id}` : phase ? `/ruta/${phase.id}` : '/ruta'
  const action =
    suggestion.kind === 'next' && !hasHistory ? 'Empezar a estudiar' : 'Seguir estudiando'

  return (
    <Hero className="flex flex-col justify-between gap-8">
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-hero-muted">{contextOf(suggestion, where)}</p>
        <h2 className="text-lead text-balance wrap-break-word hyphens-auto">{title}</h2>
        {topic && (
          <>
            <p className="max-w-xl text-pretty text-hero-muted">{topic.topic.details}</p>
            <p className="text-sm font-semibold">
              {statusLabels[statusOf(topicStatuses, topic.topic.id)]}
            </p>
          </>
        )}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <ButtonLink to={suggestion.to} variant="inverse" size="lg">
          <Play className="size-5 fill-current" />
          {action}
        </ButtonLink>
        <ButtonLink to={detailsUrl} variant="outline" size="lg">
          {topic ? 'Ver tema' : 'Ver proyecto'}
        </ButtonLink>
      </div>
    </Hero>
  )
}
