import { describe, expect, it } from 'vitest'
import { toPhase, type PhaseRow } from './roadmapApi'

const row: PhaseRow = {
  id: 'f1',
  sort_order: 1,
  title: 'Bases técnicas',
  summary: 'Resumen',
  estimated_weeks: 2,
  project_title: 'Primera API',
  project_description: 'Descripción',
  topics: [
    { id: 'f1-t2', sort_order: 1, title: 'APIs REST', details: 'b' },
    { id: 'f1-t1', sort_order: 0, title: 'HTTP', details: 'a' },
  ],
}

describe('toPhase', () => {
  it('convierte la fila al tipo Phase y ordena los temas por sort_order', () => {
    expect(toPhase(row)).toEqual({
      id: 'f1',
      order: 1,
      title: 'Bases técnicas',
      summary: 'Resumen',
      estimated_weeks: 2,
      project: { title: 'Primera API', description: 'Descripción' },
      topics: [
        { id: 'f1-t1', title: 'HTTP', details: 'a' },
        { id: 'f1-t2', title: 'APIs REST', details: 'b' },
      ],
    })
  })
})
