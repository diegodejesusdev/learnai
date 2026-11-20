import { describe, expect, it } from 'vitest'
import { phases as realPhases } from '@/data/curriculum'
import type { Phase } from '@/types/curriculum'
import {
  countByFilter,
  doneCount,
  matchesFilter,
  nextStatus,
  nextTopic,
  parseStatusFilter,
  phaseProgress,
  phaseStatus,
  totalProgress,
} from './progress'

function phase(id: string, order: number, topicCount: number): Phase {
  return {
    id,
    order,
    title: `Fase ${id}`,
    summary: '',
    estimated_weeks: 1,
    project: { title: 'Proyecto', description: '' },
    topics: Array.from({ length: topicCount }, (_, index) => ({
      id: `${id}-t${index + 1}`,
      title: `Tema ${index + 1}`,
      details: '',
    })),
  }
}

const fa = phase('fa', 0, 3)
const fb = phase('fb', 1, 2)

describe('phaseProgress', () => {
  it('sin datos todo está pendiente', () => {
    expect(phaseProgress(fa, {})).toEqual({ done: 0, total: 3, ratio: 0 })
  })

  it('cuenta solo temas «hechos»; «en curso» no suma', () => {
    expect(phaseProgress(fa, { 'fa-t1': 'hecho', 'fa-t2': 'en_curso' })).toEqual({
      done: 1,
      total: 3,
      ratio: 1 / 3,
    })
  })

  it('fase completa = 100 %', () => {
    expect(phaseProgress(fb, { 'fb-t1': 'hecho', 'fb-t2': 'hecho' }).ratio).toBe(1)
  })

  it('ignora estados de temas de otras fases', () => {
    expect(phaseProgress(fa, { 'fb-t1': 'hecho' }).done).toBe(0)
  })
})

describe('totalProgress', () => {
  it('la ruta real tiene 100 temas', () => {
    expect(totalProgress(realPhases, {})).toEqual({ done: 0, total: 100, ratio: 0 })
  })

  it('suma los temas hechos de todas las fases', () => {
    const result = totalProgress([fa, fb], {
      'fa-t1': 'hecho',
      'fb-t2': 'hecho',
      'fb-t1': 'en_curso',
    })
    expect(result).toEqual({ done: 2, total: 5, ratio: 0.4 })
  })

  it('una lista vacía da 0 sin dividir por cero', () => {
    expect(totalProgress([], {}).ratio).toBe(0)
  })
})

describe('doneCount', () => {
  it('cuenta proyectos hechos sobre el total de fases', () => {
    expect(doneCount(['fa', 'fb'], { fa: 'hecho', fb: 'en_curso' })).toEqual({
      done: 1,
      total: 2,
      ratio: 0.5,
    })
  })
})

describe('phaseStatus', () => {
  it('sin empezar → pendiente', () => {
    expect(phaseStatus(fa, {})).toBe('pendiente')
  })

  it('algún tema en curso o hecho → en curso', () => {
    expect(phaseStatus(fa, { 'fa-t2': 'en_curso' })).toBe('en_curso')
    expect(phaseStatus(fa, { 'fa-t1': 'hecho' })).toBe('en_curso')
  })

  it('todos los temas hechos → hecho', () => {
    expect(phaseStatus(fb, { 'fb-t1': 'hecho', 'fb-t2': 'hecho' })).toBe('hecho')
  })
})

describe('nextTopic', () => {
  it('sin progreso sugiere el primer tema de la ruta', () => {
    expect(nextTopic([fa, fb], {})?.topic.id).toBe('fa-t1')
  })

  it('prefiere el primer tema «en curso» aunque haya pendientes antes', () => {
    const statuses = { 'fa-t1': 'hecho', 'fb-t2': 'en_curso' } as const
    expect(nextTopic([fa, fb], statuses)?.topic.id).toBe('fb-t2')
  })

  it('entre varios «en curso», el primero en orden', () => {
    const statuses = { 'fb-t1': 'en_curso', 'fa-t3': 'en_curso' } as const
    expect(nextTopic([fa, fb], statuses)?.topic.id).toBe('fa-t3')
  })

  it('sin temas en curso, el primer pendiente saltando los hechos', () => {
    const statuses = { 'fa-t1': 'hecho', 'fa-t2': 'hecho' } as const
    const result = nextTopic([fa, fb], statuses)
    expect(result?.topic.id).toBe('fa-t3')
    expect(result?.phase.id).toBe('fa')
  })

  it('todo hecho → no hay sugerencia', () => {
    const all = Object.fromEntries(
      [fa, fb].flatMap((p) => p.topics.map((t) => [t.id, 'hecho' as const])),
    )
    expect(nextTopic([fa, fb], all)).toBeUndefined()
  })
})

describe('nextStatus', () => {
  it('un toque avanza pendiente → en curso → hecho → pendiente', () => {
    expect(nextStatus('pendiente')).toBe('en_curso')
    expect(nextStatus('en_curso')).toBe('hecho')
    expect(nextStatus('hecho')).toBe('pendiente')
  })
})

describe('filtros', () => {
  it('lee el filtro de la URL y descarta valores desconocidos', () => {
    expect(parseStatusFilter('en_curso')).toBe('en_curso')
    expect(parseStatusFilter(null)).toBe('todos')
    expect(parseStatusFilter('listo')).toBe('todos')
  })

  it('«todos» deja pasar cualquier estado', () => {
    expect(matchesFilter('hecho', 'todos')).toBe(true)
    expect(matchesFilter('hecho', 'pendiente')).toBe(false)
    expect(matchesFilter('en_curso', 'en_curso')).toBe(true)
  })

  it('cuenta por estado para mostrar en cada filtro', () => {
    expect(countByFilter(['pendiente', 'hecho', 'hecho'])).toEqual({
      todos: 3,
      pendiente: 1,
      en_curso: 0,
      hecho: 2,
    })
  })
})
