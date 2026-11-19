import { describe, expect, it } from 'vitest'
import rootCurriculum from '../../curriculum.json'
import appCurriculum from './curriculum.json'
import { allTopics, findTopic, phases } from './curriculum'

describe('curriculum.json', () => {
  it('la copia en src/data es idéntica a la de la raíz', () => {
    expect(appCurriculum).toEqual(rootCurriculum)
  })

  it('tiene 9 fases en orden, 100 temas y 14 ítems de checklist', () => {
    expect(phases.map((phase) => phase.id)).toEqual([
      'f0',
      'f1',
      'f2',
      'f3',
      'f4',
      'f5',
      'f6',
      'f7',
      'f8',
    ])
    expect(allTopics).toHaveLength(100)
    expect(appCurriculum.final_checklist).toHaveLength(14)
  })

  it('los ids de temas son únicos y empiezan por el id de su fase', () => {
    const ids = allTopics.map(({ topic }) => topic.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const { topic, phase } of allTopics) {
      expect(topic.id.startsWith(`${phase.id}-`)).toBe(true)
    }
  })

  it('findTopic devuelve el tema con su fase', () => {
    expect(findTopic('f1-t10')?.phase.id).toBe('f1')
    expect(findTopic('no-existe')).toBeUndefined()
  })
})
