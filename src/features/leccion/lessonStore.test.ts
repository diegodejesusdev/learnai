import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Lesson } from './lessonApi'
import { clearSavedLessons, readSavedLesson, savedHashes, saveLessons } from './lessonStore'

const lesson = (topicId: string, overrides: Partial<Lesson> = {}): Lesson => ({
  topicId,
  content: `## Objetivo\n\n${topicId}`,
  minutes: 25,
  updated: '2026-11-24',
  hash: `hash-${topicId}`,
  ...overrides,
})

afterEach(() => clearSavedLessons())

describe('lecciones guardadas en el dispositivo', () => {
  it('lo guardado se lee igual', async () => {
    expect(await saveLessons([lesson('cl-f0-t1'), lesson('cl-f0-t2')])).toBe(true)
    expect(await readSavedLesson('cl-f0-t1')).toEqual(lesson('cl-f0-t1'))
    expect(await readSavedLesson('cl-f0-t9')).toBeNull()
  })

  it('guardar otra vez reemplaza la copia', async () => {
    await saveLessons([lesson('cl-f0-t1')])
    await saveLessons([lesson('cl-f0-t1', { content: 'Nueva', hash: 'h2' })])
    expect((await readSavedLesson('cl-f0-t1'))?.content).toBe('Nueva')
    expect(await savedHashes(['cl-f0-t1'])).toEqual({ 'cl-f0-t1': 'h2' })
  })

  it('dice qué versión hay guardada de cada tema', async () => {
    await saveLessons([lesson('cl-f0-t1')])
    expect(await savedHashes(['cl-f0-t1', 'cl-f0-t2'])).toEqual({ 'cl-f0-t1': 'hash-cl-f0-t1' })
  })

  it('al cerrar sesión se borran, con sus imágenes', async () => {
    const deleted: string[] = []
    vi.stubGlobal('caches', {
      delete: (name: string) => Promise.resolve(void deleted.push(name)),
    })
    await saveLessons([lesson('cl-f0-t1')])
    await clearSavedLessons()
    expect(await readSavedLesson('cl-f0-t1')).toBeNull()
    expect(deleted).toEqual(['learnai-lesson-images'])
    vi.unstubAllGlobals()
  })
})

describe('si el navegador no deja guardar', () => {
  it('la app sigue: no hay copia, pero nada falla', async () => {
    vi.resetModules()
    vi.stubGlobal('indexedDB', undefined)
    const store = await import('./lessonStore')
    expect(await store.saveLessons([lesson('cl-f0-t1')])).toBe(false)
    expect(await store.readSavedLesson('cl-f0-t1')).toBeNull()
    expect(await store.savedHashes(['cl-f0-t1'])).toEqual({})
    await expect(store.clearSavedLessons()).resolves.toBeUndefined()
    vi.unstubAllGlobals()
  })
})
