import { describe, expect, it } from 'vitest'
import type { LessonIndex, LessonProgressMap } from './lessonApi'
import {
  downloadState,
  isLessonRead,
  lessonProgressOf,
  nextProgress,
  readingPercent,
  withLessonProgress,
} from './lessonModel'

const NOW = '2026-11-24T15:00:00.000Z'
const LATER = '2026-11-25T15:00:00.000Z'

describe('readingPercent', () => {
  // La lección mide 2000 px y la pantalla 800.
  it('es cuánto de la lección ya pasó por la pantalla', () => {
    expect(readingPercent({ top: 800, height: 2000 }, 800)).toBe(0)
    expect(readingPercent({ top: -200, height: 2000 }, 800)).toBe(50)
    expect(readingPercent({ top: -1200, height: 2000 }, 800)).toBe(100)
  })

  it('no se sale de 0 a 100', () => {
    expect(readingPercent({ top: 1500, height: 2000 }, 800)).toBe(0)
    expect(readingPercent({ top: -5000, height: 2000 }, 800)).toBe(100)
  })

  it('a unos píxeles del final ya cuenta como el final', () => {
    expect(readingPercent({ top: -1195, height: 2000 }, 800)).toBe(100)
  })

  it('si la página aún no se ha dibujado, es 0 (no queda leída sola)', () => {
    expect(readingPercent({ top: 0, height: 0 }, 800)).toBe(0)
  })
})

describe('nextProgress', () => {
  const fresh = { scrollPct: 0, readAt: null }

  it('guarda de 10 en 10, para no llenar la cola sin conexión', () => {
    expect(nextProgress(fresh, 9, NOW)).toBeNull()
    expect(nextProgress(fresh, 37, NOW)).toEqual({ scrollPct: 30, readAt: null })
    expect(nextProgress({ scrollPct: 30, readAt: null }, 39, NOW)).toBeNull()
  })

  it('subir en la página no baja el porcentaje', () => {
    expect(nextProgress({ scrollPct: 60, readAt: null }, 20, NOW)).toBeNull()
  })

  it('al llegar al final queda leída', () => {
    expect(nextProgress({ scrollPct: 90, readAt: null }, 100, NOW)).toEqual({
      scrollPct: 100,
      readAt: NOW,
    })
  })

  it('una lección ya leída no se vuelve a guardar', () => {
    expect(nextProgress({ scrollPct: 100, readAt: NOW }, 100, LATER)).toBeNull()
  })
})

describe('withLessonProgress', () => {
  const map: LessonProgressMap = { 'cl-f0-t1': { scrollPct: 100, readAt: NOW } }

  it('agrega el tema la primera vez, sin tocar los demás', () => {
    const next = withLessonProgress(map, { topicId: 'cl-f0-t2', scrollPct: 20, readAt: null })
    expect(next).toEqual({ ...map, 'cl-f0-t2': { scrollPct: 20, readAt: null } })
    expect(map).not.toHaveProperty('cl-f0-t2')
  })

  it('igual que la base: queda el porcentaje más alto y la primera lectura', () => {
    const again = withLessonProgress(map, { topicId: 'cl-f0-t1', scrollPct: 30, readAt: LATER })
    expect(again['cl-f0-t1']).toEqual({ scrollPct: 100, readAt: NOW })
    const earlier = withLessonProgress(
      { 'cl-f0-t1': { scrollPct: 100, readAt: LATER } },
      { topicId: 'cl-f0-t1', scrollPct: 100, readAt: NOW },
    )
    expect(earlier['cl-f0-t1']?.readAt).toBe(NOW)
  })

  it('leída solo si llegó al final', () => {
    expect(isLessonRead(map, 'cl-f0-t1')).toBe(true)
    expect(isLessonRead({ 'cl-f0-t1': { scrollPct: 90, readAt: null } }, 'cl-f0-t1')).toBe(false)
    expect(isLessonRead(undefined, 'cl-f0-t1')).toBe(false)
    expect(lessonProgressOf(map, 'otro')).toEqual({ scrollPct: 0, readAt: null })
  })
})

describe('downloadState', () => {
  const info = (topicId: string, hash: string) => ({
    topicId,
    hash,
    minutes: 20,
    updated: '2026-11-24',
  })
  const index: LessonIndex = { a: info('a', '1'), b: info('b', '2'), c: info('c', '3') }
  const phase = ['a', 'b', 'c', 'sin-leccion']

  it('cuenta solo los temas que tienen lección', () => {
    expect(downloadState(phase, index, {})).toEqual({
      pending: ['a', 'b', 'c'],
      saved: 0,
      changed: 0,
    })
    expect(downloadState(['sin-leccion'], index, {})).toEqual({ pending: [], saved: 0, changed: 0 })
  })

  it('distingue las que faltan de las que cambiaron desde que se guardaron', () => {
    expect(downloadState(phase, index, { a: '1', b: 'vieja' })).toEqual({
      pending: ['b', 'c'],
      saved: 1,
      changed: 1,
    })
  })

  it('todas guardadas y al día', () => {
    expect(downloadState(phase, index, { a: '1', b: '2', c: '3' })).toEqual({
      pending: [],
      saved: 3,
      changed: 0,
    })
  })
})
