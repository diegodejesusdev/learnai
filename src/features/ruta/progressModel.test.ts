import { describe, expect, it } from 'vitest'
import type { ProgressSnapshot } from './progressApi'
import {
  checklistDoneCount,
  emptySnapshot,
  topicProgressOf,
  topicStatuses,
  withChecklistItem,
  withProject,
  withTopicNotes,
  withTopicStatus,
} from './progressModel'

const NOW = '2026-11-19T15:00:00.000Z'
const EARLIER = '2026-11-01T12:00:00.000Z'

const snapshot: ProgressSnapshot = {
  topics: { 'f0-t1': { status: 'hecho', notes: 'mis notas', completed_at: EARLIER } },
  projects: {},
  checklist: { c1: { done: true, done_at: EARLIER } },
}

describe('lectura del snapshot', () => {
  it('un tema sin fila está pendiente y sin notas', () => {
    expect(topicProgressOf(emptySnapshot, 'f0-t2')).toEqual({
      status: 'pendiente',
      notes: '',
      completed_at: null,
    })
  })

  it('mapa de estados por tema', () => {
    expect(topicStatuses(snapshot)).toEqual({ 'f0-t1': 'hecho' })
  })
})

describe('cambios optimistas', () => {
  it('pasar a «hecho» llena completed_at y salir de «hecho» lo borra', () => {
    const done = withTopicStatus(emptySnapshot, 'f0-t2', 'hecho', NOW)
    expect(done.topics['f0-t2']?.completed_at).toBe(NOW)
    const undone = withTopicStatus(done, 'f0-t2', 'en_curso', NOW)
    expect(undone.topics['f0-t2']?.completed_at).toBeNull()
  })

  it('volver a marcar «hecho» conserva la fecha original', () => {
    expect(withTopicStatus(snapshot, 'f0-t1', 'hecho', NOW).topics['f0-t1']?.completed_at).toBe(
      EARLIER,
    )
  })

  it('cambiar el estado no borra las notas, y cambiar las notas no toca el estado', () => {
    expect(withTopicStatus(snapshot, 'f0-t1', 'en_curso', NOW).topics['f0-t1']?.notes).toBe(
      'mis notas',
    )
    expect(withTopicNotes(snapshot, 'f0-t1', 'nuevas').topics['f0-t1']).toMatchObject({
      status: 'hecho',
      notes: 'nuevas',
    })
  })

  it('no modifica el snapshot original (la caché anterior sirve para revertir)', () => {
    withTopicStatus(snapshot, 'f0-t1', 'pendiente', NOW)
    expect(snapshot.topics['f0-t1']?.status).toBe('hecho')
  })

  it('el proyecto mezcla el cambio con lo que ya tenía', () => {
    const withRepo = withProject(emptySnapshot, 'f1', { repo_url: 'https://github.com/d/api' }, NOW)
    const done = withProject(withRepo, 'f1', { status: 'hecho' }, NOW)
    expect(done.projects.f1).toEqual({
      status: 'hecho',
      repo_url: 'https://github.com/d/api',
      demo_url: null,
      notes: '',
      completed_at: NOW,
    })
  })

  it('la checklist guarda la fecha al marcar y la borra al desmarcar', () => {
    const marked = withChecklistItem(emptySnapshot, 'c2', true, NOW)
    expect(marked.checklist.c2).toEqual({ done: true, done_at: NOW })
    expect(withChecklistItem(marked, 'c2', false, NOW).checklist.c2).toEqual({
      done: false,
      done_at: null,
    })
  })

  it('la checklist de una ruta no cuenta los ítems de otra', () => {
    const both = withChecklistItem(snapshot, 'de-c1', true, NOW)
    expect(checklistDoneCount(both, [{ id: 'c1' }, { id: 'c2' }])).toBe(1)
    expect(checklistDoneCount(both, [{ id: 'de-c1' }, { id: 'de-c2' }])).toBe(1)
    expect(
      checklistDoneCount(withChecklistItem(both, 'c2', true, NOW), [{ id: 'c1' }, { id: 'c2' }]),
    ).toBe(2)
  })
})
