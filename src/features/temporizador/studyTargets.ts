import {
  allPhases,
  findPhaseIn,
  findTopicIn,
  phaseLabel,
  type TargetIds,
  type Track,
} from '@/lib/roadmap'
import type { StudyTargetRef } from './timerModel'

/** Algo que se puede estudiar: un tema o el proyecto de una fase. */
export interface StudyTarget {
  key: string
  kind: 'topic' | 'project'
  ref: StudyTargetRef
  title: string
  /** «Fase 1 · Bases técnicas» o «Proyecto · Fase 1». */
  phaseContext: string
  /** Lo mismo, con la ruta delante. */
  context: string
  trackId: string
  trackTitle: string
}

/** Los temas y proyectos de las rutas, en el orden en que se pasan (activeFirst). */
export function studyTargets(tracks: readonly Track[]): StudyTarget[] {
  return tracks.flatMap((track) => {
    const inTrack = (
      target: Pick<StudyTarget, 'key' | 'kind' | 'ref' | 'title' | 'phaseContext'>,
    ): StudyTarget => ({
      ...target,
      context: `${track.title} · ${target.phaseContext}`,
      trackId: track.id,
      trackTitle: track.title,
    })
    return track.phases.flatMap((phase) => [
      ...phase.topics.map((topic) =>
        inTrack({
          key: `tema:${topic.id}`,
          kind: 'topic',
          ref: { topicId: topic.id, projectPhaseId: null },
          title: topic.title,
          phaseContext: `${phaseLabel(phase)} · ${phase.title}`,
        }),
      ),
      inTrack({
        key: `proyecto:${phase.id}`,
        kind: 'project',
        ref: { topicId: null, projectPhaseId: phase.id },
        title: phase.project.title,
        phaseContext: `Proyecto · ${phaseLabel(phase)}`,
      }),
    ])
  })
}

export function targetKeyOf(ref: TargetIds): string {
  return ref.topicId ? `tema:${ref.topicId}` : `proyecto:${ref.projectPhaseId ?? ''}`
}

/** Minúsculas y sin tildes: «automatización» encuentra «Automatizacion». */
function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

/** Busca por nombre: todas las palabras deben aparecer en el título (o en la fase). */
export function searchTargets(
  targets: readonly StudyTarget[],
  query: string,
  limit = 8,
): StudyTarget[] {
  const words = fold(query).split(/\s+/).filter(Boolean)
  if (words.length === 0) return []
  const matches = targets.filter((target) => {
    // Sin el nombre de la ruta: «datos» traería todos los temas de Ingeniería de datos.
    const haystack = fold(`${target.title} ${target.phaseContext}`)
    return words.every((word) => haystack.includes(word))
  })
  // Primero los que coinciden en el título.
  const inTitle = matches.filter((target) =>
    words.every((word) => fold(target.title).includes(word)),
  )
  const rest = matches.filter((target) => !inTitle.includes(target))
  return [...inTitle, ...rest].slice(0, limit)
}

export interface TrackResults {
  trackId: string
  title: string
  results: StudyTarget[]
}

/** La búsqueda agrupada por ruta. El límite es por ruta, para que una no tape a la otra. */
export function searchByTrack(
  targets: readonly StudyTarget[],
  query: string,
  limit = 6,
): TrackResults[] {
  const titles = new Map(targets.map((target) => [target.trackId, target.trackTitle]))
  return [...titles]
    .map(([trackId, title]) => ({
      trackId,
      title,
      results: searchTargets(
        targets.filter((target) => target.trackId === trackId),
        query,
        limit,
      ),
    }))
    .filter((group) => group.results.length > 0)
}

/** Título del tema o proyecto al que apunta un temporizador o una sesión. */
export function targetTitle(tracks: readonly Track[], ref: TargetIds): string | undefined {
  const phases = allPhases(tracks)
  return ref.topicId !== null
    ? findTopicIn(phases, ref.topicId)?.topic.title
    : findPhaseIn(phases, ref.projectPhaseId ?? undefined)?.project.title
}
