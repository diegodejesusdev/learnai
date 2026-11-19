import { Play } from 'lucide-react'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { findTopic, phaseLabel } from '@/data/curriculum'
import { demoTopicStatuses } from '@/data/demo'
import { statusOf } from '@/lib/progress'

export function ContinueStudyingCard({ topicId }: { topicId: string }) {
  const found = findTopic(topicId)
  if (!found) return null
  const { topic, phase } = found

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-fg-muted">
          Último tema · {phaseLabel(phase)}: {phase.title}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-semibold tracking-tight">{topic.title}</h2>
          <StatusBadge status={statusOf(demoTopicStatuses, topic.id)} />
        </div>
        <p className="text-sm text-fg-muted">{topic.details}</p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <ButtonLink to={`/estudiar?tema=${topic.id}`} size="lg" className="sm:flex-1">
          <Play className="size-5" />
          Seguir estudiando
        </ButtonLink>
        <ButtonLink to={`/ruta/tema/${topic.id}`} variant="secondary" size="lg">
          Ver tema
        </ButtonLink>
      </div>
    </Card>
  )
}
