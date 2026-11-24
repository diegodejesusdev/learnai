import { ChevronRight } from 'lucide-react'
import { Link, useLocation } from 'react-router'
import { rowClasses } from '@/components/ui/styles'
import { cn } from '@/lib/cn'
import { formatDuration, formatShortDate, formatTime } from '@/lib/dates'
import { studyModeLabels } from '@/lib/labels'
import { findPhaseIn, findTopicIn, trackOfTarget, trackPhaseLabel, type Track } from '@/lib/roadmap'
import type { StudySession } from './sessionsApi'

interface SessionRowProps {
  session: StudySession
  tracks: readonly Track[]
  /** En el detalle de un día ya se sabe la fecha: solo se muestra la hora. */
  showDate?: boolean
}

function describeTarget(session: StudySession, tracks: readonly Track[]) {
  const { topicId, projectPhaseId } = session.target
  const track = trackOfTarget(tracks, session.target)
  const phases = track?.phases ?? []
  if (topicId !== null) {
    const found = findTopicIn(phases, topicId)
    return {
      title: found?.topic.title ?? topicId,
      context: track && found ? trackPhaseLabel(track, found.phase) : '',
    }
  }
  const phase = findPhaseIn(phases, projectPhaseId)
  return {
    title: phase?.project.title ?? projectPhaseId,
    context: track && phase ? `Proyecto · ${trackPhaseLabel(track, phase)}` : 'Proyecto',
  }
}

/** Una sesión en una lista. Al tocarla se abre para editarla o borrarla. */
export function SessionRow({ session, tracks, showDate = true }: SessionRowProps) {
  const location = useLocation()
  const { title, context } = describeTarget(session, tracks)
  return (
    <Link
      to={`/historial/sesion/${session.id}`}
      // Para volver al Historial con los mismos filtros y el mismo día elegido.
      state={{ returnTo: location.pathname + location.search }}
      className={cn(rowClasses, 'flex min-h-14 items-start gap-4 py-4')}
    >
      <div className="flex w-18 shrink-0 flex-col pt-px whitespace-nowrap">
        {showDate && (
          <span className="text-sm font-bold tabular-nums">
            {formatShortDate(session.startedAt)}
          </span>
        )}
        <span
          className={cn('tabular-nums', showDate ? 'text-xs text-fg-muted' : 'text-sm font-bold')}
        >
          {formatTime(session.startedAt)}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="line-clamp-2 font-bold tracking-tight">{title}</span>
        <span className="text-sm text-fg-muted">
          <span className="font-bold text-fg tabular-nums">
            {formatDuration(session.durationMinutes)}
          </span>
          {` · ${context} · ${studyModeLabels[session.mode]}`}
        </span>
        {session.notes && <span className="truncate text-sm text-fg-muted">{session.notes}</span>}
      </div>
      <ChevronRight className="mt-0.5 size-5 shrink-0 text-fg-muted" />
    </Link>
  )
}
