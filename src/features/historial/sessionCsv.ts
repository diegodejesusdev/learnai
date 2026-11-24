import { toCsv } from '@/lib/csv'
import { formatInZone, toDayKey } from '@/lib/dates'
import { studyModeLabels } from '@/lib/labels'
import { findPhaseIn, findTopicIn, phaseLabel, trackOfTarget, type Track } from '@/lib/roadmap'
import type { StudySession } from './sessionsApi'

export const SESSION_CSV_HEADER = [
  'fecha',
  'hora_inicio',
  'hora_fin',
  'duracion_min',
  'modo',
  'ruta',
  'fase',
  'tipo',
  'tema_o_proyecto',
  'notas',
] as const

/** Una fila por sesión. Fecha y horas en Bogotá; la fecha es la del inicio. */
export function sessionCsvRow(session: StudySession, tracks: readonly Track[]): string[] {
  const { topicId, projectPhaseId } = session.target
  const track = trackOfTarget(tracks, session.target)
  const phases = track?.phases ?? []
  const topic = topicId !== null ? findTopicIn(phases, topicId) : undefined
  const phase = topic?.phase ?? findPhaseIn(phases, projectPhaseId ?? undefined)
  return [
    toDayKey(session.startedAt),
    formatInZone(session.startedAt, 'HH:mm'),
    formatInZone(session.endedAt, 'HH:mm'),
    String(session.durationMinutes),
    studyModeLabels[session.mode],
    track?.title ?? '',
    phase ? `${phaseLabel(phase)} · ${phase.title}` : '',
    topicId !== null ? 'tema' : 'proyecto',
    (topicId !== null ? topic?.topic.title : phase?.project.title) ??
      topicId ??
      projectPhaseId ??
      '',
    session.notes,
  ]
}

export function sessionsCsv(sessions: readonly StudySession[], tracks: readonly Track[]): string {
  return toCsv([SESSION_CSV_HEADER, ...sessions.map((session) => sessionCsvRow(session, tracks))])
}
