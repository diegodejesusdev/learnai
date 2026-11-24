import { addDaysToKey, zonedInputToDate } from '@/lib/dates'
import { allPhases, findPhaseIn, findTopicIn, findTrack, type Track } from '@/lib/roadmap'
import type { Phase } from '@/types/curriculum'
import { emptySessionQuery, type SessionQuery } from './sessionsApi'

/**
 * Filtros de la lista de sesiones, tal como van en la URL (?desde=…&hasta=…&ruta=…&fase=…&tema=…).
 * Van en la URL para que se conserven al volver de editar una sesión. '' = sin filtro.
 */
export interface SessionFilters {
  /** Días de Bogotá 'yyyy-MM-dd', ambos incluidos. */
  from: string
  to: string
  trackId: string
  phaseId: string
  /** 'tema:<id>' o 'proyecto:<id de fase>' (como en studyTargets). */
  targetKey: string
}

export const emptyFilters: SessionFilters = {
  from: '',
  to: '',
  trackId: '',
  phaseId: '',
  targetKey: '',
}

function validDay(value: string | null): string {
  return value && zonedInputToDate(value, '00:00') ? value : ''
}

export function readSessionFilters(params: URLSearchParams): SessionFilters {
  const topic = params.get('tema')
  const project = params.get('proyecto')
  return {
    from: validDay(params.get('desde')),
    to: validDay(params.get('hasta')),
    trackId: params.get('ruta') ?? '',
    phaseId: params.get('fase') ?? project ?? '',
    targetKey: topic ? `tema:${topic}` : project ? `proyecto:${project}` : '',
  }
}

/** Escribe los filtros en la URL sin tocar los demás parámetros (p. ej. el día elegido). */
export function writeSessionFilters(
  params: URLSearchParams,
  filters: SessionFilters,
): URLSearchParams {
  const next = new URLSearchParams(params)
  for (const name of ['desde', 'hasta', 'ruta', 'fase', 'tema', 'proyecto']) next.delete(name)
  if (filters.from) next.set('desde', filters.from)
  if (filters.to) next.set('hasta', filters.to)
  if (filters.trackId) next.set('ruta', filters.trackId)
  if (filters.phaseId) next.set('fase', filters.phaseId)
  const [kind, id] = filters.targetKey.split(':')
  if (id && kind === 'tema') next.set('tema', id)
  if (id && kind === 'proyecto') next.set('proyecto', id)
  return next
}

export function hasFilters(filters: SessionFilters): boolean {
  return Object.values(filters).some(Boolean)
}

function scopeOf(phases: readonly Phase[]): SessionQuery['scope'] {
  return {
    phaseIds: phases.map((phase) => phase.id),
    topicIds: phases.flatMap((phase) => phase.topics.map((topic) => topic.id)),
  }
}

/**
 * Los filtros, traducidos a la consulta. Los días se cuentan en hora de Bogotá. Con una ruta
 * elegida, una fase o un tema de otra ruta (p. ej. de una URL vieja) se ignoran.
 */
export function toSessionQuery(filters: SessionFilters, tracks: readonly Track[]): SessionQuery {
  const track = findTrack(tracks, filters.trackId)
  const phases = track?.phases ?? allPhases(tracks)
  const query: SessionQuery = { ...emptySessionQuery }
  if (filters.from) query.from = zonedInputToDate(filters.from, '00:00')?.toISOString() ?? null
  if (filters.to) {
    query.before = zonedInputToDate(addDaysToKey(filters.to, 1), '00:00')?.toISOString() ?? null
  }
  const [kind, id] = filters.targetKey.split(':')
  if (kind === 'tema' && id && findTopicIn(phases, id)) {
    query.target = { topicId: id, projectPhaseId: null }
  } else if (kind === 'proyecto' && id && findPhaseIn(phases, id)) {
    query.target = { topicId: null, projectPhaseId: id }
  } else {
    const phase = findPhaseIn(phases, filters.phaseId)
    if (phase) query.scope = scopeOf([phase])
    else if (track) query.scope = scopeOf(track.phases)
  }
  return query
}

/** Filtros que muestran solo las sesiones de un día. */
export function dayQuery(day: string): SessionQuery {
  return toSessionQuery({ ...emptyFilters, from: day, to: day }, [])
}
