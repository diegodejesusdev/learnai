import { BookOpen } from 'lucide-react'
import { Link } from 'react-router'
import type { TutorMode } from '@shared/tutorTypes'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { ProgressSnapshot } from '@/features/ruta/progressApi'
import { projectProgressOf, topicProgressOf, topicStatuses } from '@/features/ruta/progressModel'
import { TopicMinutes } from '@/features/ruta/TopicMinutes'
import { nextTopic, totalProgress } from '@/lib/progress'
import type { TopicWithPhase, Track } from '@/lib/roadmap'
import type { Phase, Topic } from '@/types/curriculum'

function Notes({ text }: { text: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-sm font-semibold">Tus notas</h3>
      {text.trim() === '' ? (
        <p className="text-sm text-fg-muted">Aún no tienes notas aquí.</p>
      ) : (
        <p className="line-clamp-6 text-sm wrap-anywhere whitespace-pre-line text-fg-muted">
          {text}
        </p>
      )}
    </div>
  )
}

interface TopicContextProps {
  topic: Topic
  hasLesson: boolean
  progress: ProgressSnapshot
}

function TopicContext({ topic, hasLesson, progress }: TopicContextProps) {
  const { status, notes } = topicProgressOf(progress, topic.id)
  return (
    <>
      <div className="flex flex-col gap-1">
        <p className="font-bold tracking-tight">{topic.title}</p>
        <StatusBadge status={status} />
        <TopicMinutes topicId={topic.id} />
      </div>
      {hasLesson && (
        <Link
          to={`/ruta/tema/${topic.id}/leccion`}
          className="flex min-h-11 w-fit items-center gap-2 text-sm font-semibold underline decoration-control underline-offset-4 hover:decoration-fg"
        >
          <BookOpen className="size-4 shrink-0" />
          La lección de este tema
        </Link>
      )}
      <Notes text={notes} />
      <div className="flex flex-wrap gap-2">
        <ButtonLink to={`/estudiar?tema=${topic.id}`} variant="secondary">
          Estudiar este tema
        </ButtonLink>
        <ButtonLink to={`/ruta/tema/${topic.id}`} variant="ghost">
          Ver tema
        </ButtonLink>
      </div>
    </>
  )
}

function ProjectContext({ phase, progress }: { phase: Phase; progress: ProgressSnapshot }) {
  const { status, notes } = projectProgressOf(progress, phase.id)
  return (
    <>
      <div className="flex flex-col gap-1">
        <p className="font-bold tracking-tight">{phase.project.title}</p>
        <StatusBadge status={status} />
        <p className="text-sm text-fg-muted">{phase.project.description}</p>
      </div>
      <Notes text={notes} />
      <ButtonLink to={`/ruta/${phase.id}`} variant="secondary" className="self-start">
        Ver proyecto
      </ButtonLink>
    </>
  )
}

function PlanContext({ track, progress }: { track: Track; progress: ProgressSnapshot }) {
  const statuses = topicStatuses(progress)
  const total = totalProgress(track.phases, statuses)
  const next = nextTopic(track.phases, statuses)
  return (
    <div className="flex flex-col gap-2">
      <p className="font-bold tracking-tight">{track.title}</p>
      <ProgressBar value={total.ratio} label={`Progreso de ${track.title}`} />
      <p className="text-sm text-fg-muted tabular-nums">{`${total.done} de ${total.total} temas`}</p>
      {next && (
        <p className="text-sm text-fg-muted">
          Siguiente:{' '}
          <Link
            to={`/ruta/tema/${next.topic.id}`}
            className="font-semibold text-fg underline decoration-control underline-offset-4 hover:decoration-fg"
          >
            {next.topic.title}
          </Link>
        </p>
      )}
    </div>
  )
}

interface TutorPanelProps {
  mode: TutorMode
  tracks: readonly Track[]
  progress: ProgressSnapshot
  topic: TopicWithPhase | undefined
  /** El tema tiene lección: el servidor se la da al tutor. */
  hasLesson: boolean
  project: Phase | undefined
}

/** En el PC, al lado del chat: lo que el tutor ya sabe de lo que estás viendo, con accesos. */
export function TutorPanel({ mode, tracks, progress, topic, hasLesson, project }: TutorPanelProps) {
  return (
    <aside
      aria-label="Contexto del tutor"
      className="flex flex-col gap-5 border-t-2 border-fg pt-5"
    >
      <h2 className="text-title">Lo que sabe el tutor</h2>
      {mode === 'daily_plan'
        ? tracks.map((track) => <PlanContext key={track.id} track={track} progress={progress} />)
        : mode === 'project_review'
          ? project && <ProjectContext phase={project} progress={progress} />
          : topic && <TopicContext topic={topic.topic} hasLesson={hasLesson} progress={progress} />}
    </aside>
  )
}
