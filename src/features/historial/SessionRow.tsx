import { ChevronRight } from 'lucide-react'
import { Link, useLocation } from 'react-router'
import { formatDuration, formatShortDate, formatTime } from '@/lib/dates'
import { studyModeLabels } from '@/lib/labels'
import { findPhaseIn, findTopicIn, phaseLabel } from '@/lib/roadmap'
import type { Phase } from '@/types/curriculum'
import type { StudySession } from './sessionsApi'

interface SessionRowProps {
  session: StudySession
  phases: readonly Phase[]
  /** En el detalle de un día ya se sabe la fecha: solo se muestra la hora. */
  showDate?: boolean
}

function describeTarget(session: StudySession, phases: readonly Phase[]) {
  const { topicId, projectPhaseId } = session.target
  if (topicId !== null) {
    const found = findTopicIn(phases, topicId)
    return { title: found?.topic.title ?? topicId, context: found ? phaseLabel(found.phase) : '' }
  }
  const phase = findPhaseIn(phases, projectPhaseId)
  return {
    title: phase?.project.title ?? projectPhaseId,
    context: phase ? `Proyecto · ${phaseLabel(phase)}` : 'Proyecto',
  }
}

/** Una sesión en una lista. Al tocarla se abre para editarla o borrarla. */
export function SessionRow({ session, phases, showDate = true }: SessionRowProps) {
  const location = useLocation()
  const { title, context } = describeTarget(session, phases)
  return (
    <Link
      to={`/historial/sesion/${session.id}`}
      // Para volver al Historial con los mismos filtros y el mismo día elegido.
      state={{ returnTo: location.pathname + location.search }}
      className="flex min-h-11 items-center gap-3 rounded-xl px-2 py-3 hover:bg-surface-muted"
    >
      <div className="flex w-[4.5rem] shrink-0 flex-col text-center whitespace-nowrap">
        {showDate && (
          <span className="text-sm font-semibold">{formatShortDate(session.startedAt)}</span>
        )}
        <span className={showDate ? 'text-xs text-fg-muted' : 'text-sm font-medium'}>
          {formatTime(session.startedAt)}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="line-clamp-2 font-medium">{title}</span>
        <span className="text-sm text-fg-muted">
          <span className="font-medium text-fg tabular-nums">
            {formatDuration(session.durationMinutes)}
          </span>
          {` · ${context} · ${studyModeLabels[session.mode]}`}
        </span>
        {session.notes && <span className="truncate text-sm text-fg-muted">{session.notes}</span>}
      </div>
      <ChevronRight className="size-4 shrink-0 text-fg-muted" />
    </Link>
  )
}
