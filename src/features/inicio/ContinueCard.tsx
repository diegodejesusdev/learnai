import { Play } from 'lucide-react'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatRelativeDay, toDayKey } from '@/lib/dates'
import { statusOf } from '@/lib/progress'
import { findPhaseIn, findTopicIn, phaseLabel } from '@/lib/roadmap'
import type { Phase } from '@/types/curriculum'
import type { StatusMap } from '@/types/progress'
import type { ContinueSuggestion } from './continueStudying'

interface ContinueCardProps {
  suggestion: ContinueSuggestion
  phases: readonly Phase[]
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
export function ContinueCard({ suggestion, phases, topicStatuses, hasHistory }: ContinueCardProps) {
  const { topicId, projectPhaseId } = suggestion.target
  const topic = topicId !== null ? findTopicIn(phases, topicId) : undefined
  const phase = topic?.phase ?? findPhaseIn(phases, projectPhaseId ?? undefined)
  const title = topic?.topic.title ?? phase?.project.title ?? 'Tu sesión'
  const where = phase
    ? topic
      ? `${phaseLabel(phase)}: ${phase.title}`
      : `Proyecto · ${phaseLabel(phase)}`
    : ''
  const detailsUrl = topic ? `/ruta/tema/${topic.topic.id}` : phase ? `/ruta/${phase.id}` : '/ruta'
  const action =
    suggestion.kind === 'next' && !hasHistory ? 'Empezar a estudiar' : 'Seguir estudiando'

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-fg-muted">{contextOf(suggestion, where)}</p>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          {topic && <StatusBadge status={statusOf(topicStatuses, topic.topic.id)} />}
        </div>
        {topic && <p className="text-sm text-fg-muted">{topic.topic.details}</p>}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <ButtonLink to={suggestion.to} size="lg" className="sm:flex-1">
          <Play className="size-5" />
          {action}
        </ButtonLink>
        <ButtonLink to={detailsUrl} variant="secondary" size="lg">
          {topic ? 'Ver tema' : 'Ver proyecto'}
        </ButtonLink>
      </div>
    </Card>
  )
}
