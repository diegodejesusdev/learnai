import { BookDashed, WifiOff } from 'lucide-react'
import { useParams } from 'react-router'
import { NotFoundPage } from '@/app/NotFoundPage'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { LoadingState } from '@/components/ui/LoadingState'
import { PageHeader } from '@/components/ui/PageHeader'
import { RoadmapGate } from '@/features/ruta/RoadmapGate'
import { findTopicIn, trackOfTarget, trackPhaseLabel } from '@/lib/roadmap'
import { LessonReader } from './LessonReader'
import { useLesson } from './useLesson'

function LessonContent({ topicId }: { topicId: string }) {
  const state = useLesson(topicId)
  const backToTopic = (
    <ButtonLink to={`/ruta/tema/${topicId}`} variant="secondary">
      Volver al tema
    </ButtonLink>
  )
  switch (state.status) {
    case 'ready':
      return <LessonReader lesson={state.lesson} />
    case 'loading':
      return <LoadingState label="Cargando la lección…" />
    case 'missing':
      return (
        <EmptyState
          icon={BookDashed}
          title="Lección en preparación"
          description="Este tema aún no tiene lección. Puedes estudiarlo con el temporizador o preguntarle al tutor desde la página del tema."
          action={backToTopic}
        />
      )
    case 'offline':
      return (
        <EmptyState
          icon={WifiOff}
          title="Esta lección no está en este dispositivo"
          description="Ábrela una vez con internet, o descarga la fase completa, y después podrás leerla sin conexión."
          action={backToTopic}
        />
      )
    case 'error':
      return <ErrorState title="No pudimos cargar la lección" onRetry={state.retry} />
  }
}

export function LessonPage() {
  const { topicId = '' } = useParams()
  return (
    <RoadmapGate>
      {({ roadmap }) => {
        const track = trackOfTarget(roadmap.tracks, { topicId, projectPhaseId: null })
        const found = findTopicIn(track?.phases ?? [], topicId)
        if (!track || !found) return <NotFoundPage />
        return (
          <>
            <PageHeader
              title={found.topic.title}
              eyebrow={`${trackPhaseLabel(track, found.phase)} · Lección`}
              back={{ to: `/ruta/tema/${topicId}`, label: 'Tema' }}
            />
            {/* key: al pasar a otra lección, todo arranca de nuevo */}
            <LessonContent key={topicId} topicId={topicId} />
          </>
        )
      }}
    </RoadmapGate>
  )
}
