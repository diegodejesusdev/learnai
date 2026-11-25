import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { LoadingState } from '@/components/ui/LoadingState'
import { PageHeader } from '@/components/ui/PageHeader'
import { Section } from '@/components/ui/Section'
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
import { TrackProgressCard } from './TrackProgressCard'

interface HomeContentProps extends RoadmapData {
  latest: ReturnType<typeof useLatestSession>
  summary: ReturnType<typeof useStudySummary>
}

function HomeContent({ roadmap, progress, activeTrack, latest, summary }: HomeContentProps) {
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
        phases: activeTrack.phases,
        topicStatuses: statuses,
        projectStatuses: projectStatuses(progress),
      })
    : null
  // El siguiente tema de la ruta activa, si no es ya lo que propone «Seguir estudiando».
  // Con todo hecho y nada que retomar, NextTopicCard muestra la felicitación.
  const next = nextTopic(activeTrack.phases, statuses)
  const showNext = ready && (next ? suggestion?.target.topicId !== next.topic.id : !suggestion)

  if (!ready) return <LoadingState />

  return (
    <>
      <div
        className={
          suggestion
            ? 'grid gap-10 xl:grid-cols-[minmax(0,1fr)_17rem] xl:gap-12 3xl:grid-cols-[minmax(0,1fr)_22rem] 3xl:gap-16'
            : 'flex flex-col gap-10'
        }
      >
        {suggestion && (
          <ContinueCard
            suggestion={suggestion}
            tracks={roadmap.tracks}
            topicStatuses={statuses}
            hasHistory={Boolean(latest.data)}
          />
        )}
        <HomeStats summary={summary} />
      </div>
      <div>
        {showNext && <NextTopicCard track={activeTrack} progress={progress} showTrack />}
        <Link
          to="/tutor?modo=hoy"
          className="group flex min-h-18 items-center justify-between gap-4 border-t-2 border-fg py-4 text-title transition-colors hover:text-accent"
        >
          ¿Qué estudio hoy?
          <ArrowRight className="size-6 shrink-0 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
      <Section title="Tus rutas">
        <div className="divide-y divide-border border-y border-border wide:grid wide:grid-cols-[repeat(auto-fit,minmax(18rem,1fr))] wide:items-end wide:gap-x-12 wide:divide-y-0 3xl:gap-x-16">
          {roadmap.tracks.map((track) => (
            <TrackProgressCard
              key={track.id}
              track={track}
              progress={progress}
              active={roadmap.tracks.length > 1 && track.id === activeTrack.id}
            />
          ))}
        </div>
      </Section>
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
      <div className="flex flex-col gap-12">
        <RoadmapGate>
          {(data) => <HomeContent {...data} latest={latest} summary={summary} />}
        </RoadmapGate>
      </div>
    </>
  )
}
