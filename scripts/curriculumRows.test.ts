import { describe, expect, it } from 'vitest'
import curriculumJson from '../curriculum.json' with { type: 'json' }
import type { Curriculum } from '../src/types/curriculum.ts'
import { orphanIds, toCurriculumRows, validateCurriculum } from './curriculumRows.ts'

const curriculum: Curriculum = curriculumJson

describe('toCurriculumRows', () => {
  const rows = toCurriculumRows(curriculum)

  it('genera 9 fases, 100 temas y 14 ítems', () => {
    expect(rows.phases).toHaveLength(9)
    expect(rows.topics).toHaveLength(100)
    expect(rows.checklist).toHaveLength(14)
  })

  it('aplana el proyecto en la fase y numera los temas dentro de su fase', () => {
    expect(rows.phases[1]).toMatchObject({
      id: 'f1',
      sort_order: 1,
      project_title: 'Primera API y webhook',
    })
    const f1Topics = rows.topics.filter((topic) => topic.phase_id === 'f1')
    expect(f1Topics.map((topic) => topic.sort_order)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    expect(f1Topics[9]?.id).toBe('f1-t10')
  })

  it('una sola fila de metadatos con id 1', () => {
    expect(rows.meta).toMatchObject({ id: 1, version: 1 })
  })
})

describe('validateCurriculum', () => {
  it('la ruta actual es válida', () => {
    expect(validateCurriculum(curriculum)).toEqual([])
  })

  it('detecta ids repetidos', () => {
    const [first, ...rest] = curriculum.phases
    const firstTopic = first?.topics[0]
    if (!first || !firstTopic) throw new Error('Sin datos')
    const broken: Curriculum = {
      ...curriculum,
      phases: [{ ...first, topics: [...first.topics, firstTopic] }, ...rest],
    }
    expect(validateCurriculum(broken)).toEqual(['Id de tema repetido: f0-t1'])
  })
})

describe('orphanIds', () => {
  it('lista lo que sobra en la base', () => {
    expect(orphanIds(['f0-t1', 'f0-t9'], ['f0-t1'])).toEqual(['f0-t9'])
  })
})
