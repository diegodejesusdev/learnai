import { describe, expect, it } from 'vitest'
import { automationTrack, cloudTrack, dataTrack, tracks } from '@/data/curriculum'
import { nextTopic } from './progress'
import {
  activeFirst,
  allPhases,
  findTrack,
  resolveActiveTrack,
  trackOfTarget,
  trackPhaseLabel,
} from './roadmap'

describe('ruta activa', () => {
  it('es la guardada en los ajustes', () => {
    expect(resolveActiveTrack(tracks, 'ingenieria-datos')).toBe(dataTrack)
  })

  it('sin elegir ninguna todavía, es la primera', () => {
    expect(resolveActiveTrack(tracks, null)).toBe(automationTrack)
  })

  it('con ajustes guardados por una versión anterior (sin el campo), es la primera', () => {
    expect(resolveActiveTrack(tracks, undefined)).toBe(automationTrack)
  })

  it('si la ruta guardada ya no existe, es la primera', () => {
    expect(resolveActiveTrack(tracks, 'borrada')).toBe(automationTrack)
  })

  it('sin rutas no hay ninguna', () => {
    expect(resolveActiveTrack([], 'ingenieria-datos')).toBeUndefined()
  })

  it('activeFirst pone la activa primero sin perder las demás', () => {
    expect(activeFirst(tracks, 'cloud')).toEqual([cloudTrack, automationTrack, dataTrack])
    expect(activeFirst(tracks, 'ingenieria-datos')).toEqual([
      dataTrack,
      automationTrack,
      cloudTrack,
    ])
    expect(activeFirst(tracks, 'automatizacion')).toEqual([automationTrack, dataTrack, cloudTrack])
  })
})

describe('buscar en las rutas', () => {
  it('findTrack por id', () => {
    expect(findTrack(tracks, 'ingenieria-datos')).toBe(dataTrack)
    expect(findTrack(tracks, null)).toBeUndefined()
  })

  it('allPhases junta las fases de todas, en orden', () => {
    expect(allPhases(tracks)).toHaveLength(36)
    expect(allPhases(tracks)[9]?.id).toBe('de-f0')
    expect(allPhases(tracks)[22]?.id).toBe('cl-f0')
  })

  it('la ruta de un tema o de un proyecto', () => {
    expect(trackOfTarget(tracks, { topicId: 'f1-t5', projectPhaseId: null })).toBe(automationTrack)
    expect(trackOfTarget(tracks, { topicId: 'de-f1-t4', projectPhaseId: null })).toBe(dataTrack)
    expect(trackOfTarget(tracks, { topicId: null, projectPhaseId: 'de-f12' })).toBe(dataTrack)
    expect(trackOfTarget(tracks, { topicId: 'cl-f1-t8', projectPhaseId: null })).toBe(cloudTrack)
    expect(trackOfTarget(tracks, { topicId: null, projectPhaseId: 'cl-f13' })).toBe(cloudTrack)
    expect(trackOfTarget(tracks, { topicId: 'no-existe', projectPhaseId: null })).toBeUndefined()
  })

  it('la fase con su ruta: «Fase 1» existe en todas', () => {
    const phase = dataTrack.phases[1]
    if (!phase) throw new Error('Sin datos')
    expect(trackPhaseLabel(dataTrack, phase)).toBe('Ingeniería de datos · Fase 1')
  })
})

describe('siguiente tema por ruta', () => {
  it('sin progreso, el primero de cada ruta', () => {
    expect(nextTopic(automationTrack.phases, {})?.topic.id).toBe('f0-t1')
    expect(nextTopic(dataTrack.phases, {})?.topic.id).toBe('de-f0-t1')
    expect(nextTopic(cloudTrack.phases, {})?.topic.id).toBe('cl-f0-t1')
  })

  it('lo que está en curso en una ruta no cambia la sugerencia de las otras', () => {
    const statuses = { 'f0-t1': 'hecho', 'f1-t5': 'en_curso', 'de-f0-t1': 'hecho' } as const
    expect(nextTopic(automationTrack.phases, statuses)?.topic.id).toBe('f1-t5')
    expect(nextTopic(dataTrack.phases, statuses)?.topic.id).toBe('de-f0-t2')
    expect(nextTopic(cloudTrack.phases, statuses)?.topic.id).toBe('cl-f0-t1')
  })

  it('una ruta terminada no propone temas de la otra', () => {
    const done = Object.fromEntries(
      automationTrack.phases.flatMap((phase) =>
        phase.topics.map((topic) => [topic.id, 'hecho' as const]),
      ),
    )
    expect(nextTopic(automationTrack.phases, done)).toBeUndefined()
    expect(nextTopic(dataTrack.phases, done)?.topic.id).toBe('de-f0-t1')
  })
})
