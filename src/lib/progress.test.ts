import { describe, expect, it } from 'vitest'
import { phases } from '@/data/curriculum'
import type { Phase } from '@/types/curriculum'
import { phaseProgress, totalProgress } from './progress'

const phase: Phase = {
  id: 'fx',
  order: 0,
  title: 'Fase de prueba',
  summary: '',
  estimated_weeks: 1,
  project: { title: 'Proyecto', description: '' },
  topics: [
    { id: 'fx-t1', title: 'Uno', details: '' },
    { id: 'fx-t2', title: 'Dos', details: '' },
    { id: 'fx-t3', title: 'Tres', details: '' },
  ],
}

describe('phaseProgress', () => {
  it('sin datos todo está pendiente', () => {
    expect(phaseProgress(phase, {}, {})).toEqual({ done: 0, total: 4, ratio: 0 })
  })

  it('«en curso» no suma', () => {
    const result = phaseProgress(
      phase,
      { 'fx-t1': 'hecho', 'fx-t2': 'en_curso' },
      { fx: 'en_curso' },
    )
    expect(result).toEqual({ done: 1, total: 4, ratio: 0.25 })
  })

  it('el proyecto cuenta como un ítem más aunque no haya temas hechos', () => {
    expect(phaseProgress(phase, {}, { fx: 'hecho' }).done).toBe(1)
  })

  it('fase completa = 100 %', () => {
    const topics = { 'fx-t1': 'hecho', 'fx-t2': 'hecho', 'fx-t3': 'hecho' } as const
    expect(phaseProgress(phase, topics, { fx: 'hecho' }).ratio).toBe(1)
  })
})

describe('totalProgress', () => {
  it('la ruta real tiene 100 temas + 9 proyectos', () => {
    expect(totalProgress(phases, {}, {})).toEqual({ done: 0, total: 109, ratio: 0 })
  })

  it('una lista vacía da 0 sin dividir por cero', () => {
    expect(totalProgress([], {}, {}).ratio).toBe(0)
  })
})
