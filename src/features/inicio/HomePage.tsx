import { CalendarClock } from 'lucide-react'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { LoadingState } from '@/components/ui/LoadingState'
import { PageHeader } from '@/components/ui/PageHeader'
import { useLatestSession } from '@/features/historial/useSessions'
import { useStudySummary } from '@/features/historial/useStudyStats'
import { NextTopicCard } from '@/features/ruta/NextTopicCard'
import { projectStatuses, topicStatuses } from '@/features/ruta/progressModel'
import { RoadmapGate, type RoadmapData } from '@/features/ruta/RoadmapGate'
import { useActiveTimer } from '@/features/temporizador/useActiveTimer'
import { formatLongDate } from '@/lib/dates'
import { nextTopic } from '@/lib/progress'
import { ContinueCard } from './ContinueCard'
import { continueSuggestion } from './continueStudying'
import { HomeStats } from './HomeStats'
import { TotalProgressCard } from './TotalProgressCard'

interface HomeContentProps extends RoadmapData {
  latest: ReturnType<typeof useLatestSession>
  summary: ReturnType<typeof useStudySummary>
}

function HomeContent({ roadmap, progress, latest, summary }: HomeContentProps) {
  const timer = useActiveTimer()
  const statuses = topicStatuses(progress)

  // Todo aparece de una vez, cuando están la última sesión y los totales: así nada se mueve
  // al llegar los datos (ni se ve una sugerencia que cambia enseguida).
  const ready =
    (latest.data !== undefined || latest.isError) && (summary.data !== undefined || summary.isError)
  const suggestion = ready
    ? continueSuggestion({
        timer: timer.data ?? null,
        latest: latest.data ?? null,
        phases: roadmap.phases,
        topicStatuses: statuses,
        projectStatuses: projectStatuses(progress),
      })
    : null
  // El siguiente tema de la ruta, si no es ya lo que propone «Seguir estudiando».
  // Con todo hecho y nada que retomar, NextTopicCard muestra la felicitación.
  const next = nextTopic(roadmap.phases, statuses)
  const showNext = ready && (next ? suggestion?.target.topicId !== next.topic.id : !suggestion)

  if (!ready) return <LoadingState />

  return (
    <>
      {suggestion && (
        <ContinueCard
          suggestion={suggestion}
          phases={roadmap.phases}
          topicStatuses={statuses}
          hasHistory={Boolean(latest.data)}
        />
      )}
      <ButtonLink to="/tutor?modo=hoy" variant="secondary" size="lg">
        <CalendarClock className="size-5" />
        ¿Qué estudio hoy?
      </ButtonLink>
      <HomeStats summary={summary} />
      {showNext && <NextTopicCard roadmap={roadmap} progress={progress} />}
      <TotalProgressCard roadmap={roadmap} progress={progress} />
    </>
  )
}

export function HomePage() {
  // Se piden aquí, a la vez que la ruta y el progreso (RoadmapGate), y no después: una ida y
  // vuelta menos antes de pintar Inicio.
  const latest = useLatestSession()
  const summary = useStudySummary()
  return (
    <>
      <PageHeader title="Inicio" description={formatLongDate(new Date())} />
      <div className="flex flex-col gap-4">
        <RoadmapGate>
          {(data) => <HomeContent {...data} latest={latest} summary={summary} />}
        </RoadmapGate>
      </div>
    </>
  )
}
