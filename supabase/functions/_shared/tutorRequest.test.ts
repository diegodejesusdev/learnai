import { describe, expect, it } from 'vitest'
import { parseTutorRequest } from './tutorRequest.ts'

const ID = '0b9f3b1e-7a3c-4f39-9a51-0c1d2e3f4a5b'

describe('parseTutorRequest', () => {
  it('acepta cada modo con lo que le corresponde', () => {
    expect(parseTutorRequest({ mode: 'explain', topicId: 'f1-t5', message: ' Hola ' })).toEqual({
      ok: true,
      request: {
        conversationId: null,
        mode: 'explain',
        topicId: 'f1-t5',
        phaseId: null,
        message: 'Hola',
      },
    })
    expect(
      parseTutorRequest({ mode: 'quiz', topicId: 'f1-t5', conversationId: ID, message: 'Quiz' }).ok,
    ).toBe(true)
    expect(
      parseTutorRequest({ mode: 'project_review', phaseId: 'f1', message: 'Mi flujo' }).ok,
    ).toBe(true)
    expect(parseTutorRequest({ mode: 'daily_plan', message: 'Tengo 45 minutos' }).ok).toBe(true)
  })

  it('rechaza modos, ids y combinaciones inválidas', () => {
    expect(parseTutorRequest(null)).toMatchObject({ ok: false })
    expect(parseTutorRequest({ mode: 'chat', message: 'x' })).toMatchObject({
      error: 'Modo del tutor desconocido.',
    })
    expect(parseTutorRequest({ mode: 'explain', message: 'x' })).toMatchObject({
      error: 'Elige un tema.',
    })
    expect(
      parseTutorRequest({ mode: 'project_review', topicId: 'f1-t1', message: 'x' }),
    ).toMatchObject({ ok: false })
    expect(parseTutorRequest({ mode: 'daily_plan', topicId: 'f1-t1', message: 'x' })).toMatchObject(
      { ok: false },
    )
    expect(
      parseTutorRequest({ mode: 'explain', topicId: 'f1 t5; drop', message: 'x' }),
    ).toMatchObject({
      error: 'Algún identificador no es válido.',
    })
    expect(
      parseTutorRequest({ mode: 'explain', topicId: 'f1-t5', conversationId: 'abc', message: 'x' }),
    ).toMatchObject({ ok: false })
  })

  it('exige un mensaje con texto y no demasiado largo', () => {
    expect(parseTutorRequest({ mode: 'daily_plan', message: '   ' })).toMatchObject({
      error: 'Escribe un mensaje para el tutor.',
    })
    expect(parseTutorRequest({ mode: 'daily_plan', message: 'a'.repeat(20_001) })).toMatchObject({
      ok: false,
    })
  })
})
