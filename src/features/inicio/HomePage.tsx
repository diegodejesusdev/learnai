import { CalendarClock } from 'lucide-react'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { PageHeader } from '@/components/ui/PageHeader'
import { useLatestSession } from '@/features/historial/useSessions'
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

function HomeContent({ roadmap, progress }: RoadmapData) {
  const timer = useActiveTimer()
  const latest = useLatestSession()
  const statuses = topicStatuses(progress)

  // Se espera a la última sesión para no mostrar una sugerencia y cambiarla enseguida.
  const ready = latest.data !== undefined || latest.isError
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
      <HomeStats />
      {showNext && <NextTopicCard roadmap={roadmap} progress={progress} />}
      <TotalProgressCard roadmap={roadmap} progress={progress} />
    </>
  )
}

export function HomePage() {
  return (
    <>
      <PageHeader title="Inicio" description={formatLongDate(new Date())} />
      <div className="flex flex-col gap-4">
        <RoadmapGate>{(data) => <HomeContent {...data} />}</RoadmapGate>
      </div>
    </>
  )
}
