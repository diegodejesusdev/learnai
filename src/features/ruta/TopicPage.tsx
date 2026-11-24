import { MessageCircle, Play } from 'lucide-react'
import { useParams } from 'react-router'
import { NotFoundPage } from '@/app/NotFoundPage'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { PageHeader } from '@/components/ui/PageHeader'
import { Section } from '@/components/ui/Section'
import {
  findTopicIn,
  trackOfTarget,
  trackPhaseLabel,
  type TopicWithPhase,
  type Track,
} from '@/lib/roadmap'
import type { ProgressSnapshot } from './progressApi'
import { topicProgressOf } from './progressModel'
import { RoadmapGate } from './RoadmapGate'
import { TopicMinutes } from './TopicMinutes'
import { TopicNotes } from './TopicNotes'
import { TopicStatusPicker } from './TopicStatusPicker'

interface TopicViewProps extends TopicWithPhase {
  track: Track
  progress: ProgressSnapshot
}

function TopicView({ track, topic, phase, progress }: TopicViewProps) {
  const { status, notes } = topicProgressOf(progress, topic.id)

  return (
    <>
      <PageHeader
        title={topic.title}
        eyebrow={`${trackPhaseLabel(track, phase)} · ${phase.title}`}
        description={topic.details}
        back={{ to: `/ruta/${phase.id}`, label: phase.title }}
      />
      <div className="grid gap-12 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <ButtonLink to={`/estudiar?tema=${topic.id}`} size="lg">
              <Play className="size-5 fill-current" />
              Estudiar este tema
            </ButtonLink>
            <ButtonLink to={`/tutor?tema=${topic.id}`} variant="secondary" size="lg">
              <MessageCircle className="size-5" />
              Preguntarle al tutor
            </ButtonLink>
          </div>
          <Section title="Estado">
            <TopicStatusPicker topicId={topic.id} status={status} />
            <TopicMinutes topicId={topic.id} />
          </Section>
        </div>
        {/* key: al pasar a otro tema, las notas arrancan con las de ese tema */}
        <TopicNotes key={topic.id} topicId={topic.id} initialNotes={notes} />
      </div>
    </>
  )
}

export function TopicPage() {
  const { topicId = '' } = useParams()
  return (
    <RoadmapGate>
      {({ roadmap, progress }) => {
        const track = trackOfTarget(roadmap.tracks, { topicId, projectPhaseId: null })
        const found = findTopicIn(track?.phases ?? [], topicId)
        if (!track || !found) return <NotFoundPage />
        return <TopicView track={track} {...found} progress={progress} />
      }}
    </RoadmapGate>
  )
}
