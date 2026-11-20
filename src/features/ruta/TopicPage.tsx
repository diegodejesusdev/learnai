import { MessageCircle, Play } from 'lucide-react'
import { useParams } from 'react-router'
import { NotFoundPage } from '@/app/NotFoundPage'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { findTopicIn, phaseLabel, type TopicWithPhase } from '@/lib/roadmap'
import type { ProgressSnapshot } from './progressApi'
import { topicProgressOf } from './progressModel'
import { RoadmapGate } from './RoadmapGate'
import { TopicMinutes } from './TopicMinutes'
import { TopicNotes } from './TopicNotes'
import { TopicStatusPicker } from './TopicStatusPicker'

function TopicView({ topic, phase, progress }: TopicWithPhase & { progress: ProgressSnapshot }) {
  const { status, notes } = topicProgressOf(progress, topic.id)

  return (
    <>
      <PageHeader
        title={topic.title}
        eyebrow={`${phaseLabel(phase)} · ${phase.title}`}
        description={topic.details}
        back={{ to: `/ruta/${phase.id}`, label: phase.title }}
      />
      <div className="flex flex-col gap-4">
        <Card className="flex flex-col gap-3">
          <h2 className="text-sm font-medium">Estado</h2>
          <TopicStatusPicker topicId={topic.id} status={status} />
          <TopicMinutes topicId={topic.id} />
        </Card>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <ButtonLink to={`/estudiar?tema=${topic.id}`} size="lg">
            <Play className="size-5" />
            Estudiar este tema
          </ButtonLink>
          <ButtonLink to={`/tutor?tema=${topic.id}`} variant="secondary" size="lg">
            <MessageCircle className="size-5" />
            Preguntarle al tutor
          </ButtonLink>
        </div>
        {/* key: al pasar a otro tema, las notas arrancan con las de ese tema */}
        <TopicNotes key={topic.id} topicId={topic.id} initialNotes={notes} />
      </div>
    </>
  )
}

export function TopicPage() {
  const { topicId } = useParams()
  return (
    <RoadmapGate>
      {({ roadmap, progress }) => {
        const found = findTopicIn(roadmap.phases, topicId)
        return found ? <TopicView {...found} progress={progress} /> : <NotFoundPage />
      }}
    </RoadmapGate>
  )
}
