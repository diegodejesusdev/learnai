import { useParams } from 'react-router'
import { NotFoundPage } from '@/app/NotFoundPage'
import { PageHeader } from '@/components/ui/PageHeader'
import { demoTopicStatuses } from '@/data/demo'
import { statusOf } from '@/lib/progress'
import { findTopicIn, phaseLabel, type TopicWithPhase } from '@/lib/roadmap'
import { RoadmapGate } from './RoadmapGate'
import { TopicDetail } from './TopicDetail'

function TopicView({ topic, phase }: TopicWithPhase) {
  return (
    <>
      <PageHeader
        title={topic.title}
        eyebrow={`${phaseLabel(phase)} · ${phase.title}`}
        description={topic.details}
        back={{ to: `/ruta/${phase.id}`, label: phase.title }}
      />
      {/* key reinicia el estado local al pasar de un tema a otro */}
      <TopicDetail
        key={topic.id}
        topicId={topic.id}
        initialStatus={statusOf(demoTopicStatuses, topic.id)}
      />
    </>
  )
}

export function TopicPage() {
  const { topicId } = useParams()
  return (
    <RoadmapGate>
      {(roadmap) => {
        const found = findTopicIn(roadmap.phases, topicId)
        return found ? <TopicView {...found} /> : <NotFoundPage />
      }}
    </RoadmapGate>
  )
}
