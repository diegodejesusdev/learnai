import { describe, expect, it } from 'vitest'
import { readTutorUrl, targetOf, writeTutorUrl } from './tutorUrl'

const defaults = {
  topicId: 'f0-t1',
  phaseId: 'f0',
  isTopic: (id: string) => /^f\d-t\d+$/.test(id),
  isPhase: (id: string) => /^f\d$/.test(id),
}
const read = (query: string) => readTutorUrl(new URLSearchParams(query), defaults)
const ID = '0b9f3b1e-7a3c-4f39-9a51-0c1d2e3f4a5b'

describe('estado del Tutor en la URL', () => {
  it('sin parámetros: Explicar, el tema por defecto y la conversación más reciente', () => {
    expect(read('')).toEqual({
      mode: 'explain',
      topicId: 'f0-t1',
      phaseId: 'f0',
      conversation: 'latest',
    })
  })

  it('los enlaces de Ruta abren el tema o el proyecto', () => {
    expect(read('tema=f1-t5')).toMatchObject({ mode: 'explain', topicId: 'f1-t5' })
    expect(read('proyecto=f2')).toMatchObject({ mode: 'project_review', phaseId: 'f2' })
    expect(read('modo=hoy').mode).toBe('daily_plan')
  })

  it('ignora ids y modos inválidos', () => {
    expect(read('modo=chat&tema=nada&proyecto=x&conversacion=123')).toEqual(read(''))
  })

  it('conversación nueva o una concreta', () => {
    expect(read('conversacion=nueva').conversation).toBe('new')
    expect(read(`conversacion=${ID}`).conversation).toEqual({ id: ID })
  })

  it('ida y vuelta', () => {
    const state = read(`modo=quiz&tema=f1-t5&proyecto=f1&conversacion=${ID}`)
    expect(read(writeTutorUrl(state).toString())).toEqual(state)
    expect(writeTutorUrl({ ...state, conversation: 'latest' }).has('conversacion')).toBe(false)
  })

  it('cada modo va ligado a lo suyo', () => {
    const state = read('tema=f1-t5&proyecto=f1')
    expect(targetOf({ ...state, mode: 'quiz' })).toEqual({
      mode: 'quiz',
      topicId: 'f1-t5',
      phaseId: null,
    })
    expect(targetOf({ ...state, mode: 'project_review' })).toEqual({
      mode: 'project_review',
      topicId: null,
      phaseId: 'f1',
    })
    expect(targetOf({ ...state, mode: 'daily_plan' })).toEqual({
      mode: 'daily_plan',
      topicId: null,
      phaseId: null,
    })
  })
})
