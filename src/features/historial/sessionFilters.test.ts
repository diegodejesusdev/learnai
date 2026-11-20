import { describe, expect, it } from 'vitest'
import { phases } from '@/data/curriculum'
import {
  dayQuery,
  emptyFilters,
  hasFilters,
  readSessionFilters,
  toSessionQuery,
  writeSessionFilters,
} from './sessionFilters'

describe('filtros en la URL', () => {
  it('lee fechas, fase y tema', () => {
    const params = new URLSearchParams('desde=2026-11-01&hasta=2026-11-20&fase=f1&tema=f1-t5')
    expect(readSessionFilters(params)).toEqual({
      from: '2026-11-01',
      to: '2026-11-20',
      phaseId: 'f1',
      targetKey: 'tema:f1-t5',
    })
  })

  it('el proyecto implica su fase', () => {
    expect(readSessionFilters(new URLSearchParams('proyecto=f2'))).toMatchObject({
      phaseId: 'f2',
      targetKey: 'proyecto:f2',
    })
  })

  it('ignora fechas inválidas', () => {
    const params = new URLSearchParams('desde=2026-02-31&hasta=ayer')
    expect(readSessionFilters(params)).toEqual(emptyFilters)
    expect(hasFilters(emptyFilters)).toBe(false)
  })

  it('escribe los filtros sin borrar otros parámetros', () => {
    const params = new URLSearchParams('dia=2026-11-18&tema=f0-t1')
    const next = writeSessionFilters(params, {
      ...emptyFilters,
      phaseId: 'f2',
      targetKey: 'proyecto:f2',
    })
    expect(next.toString()).toBe('dia=2026-11-18&fase=f2&proyecto=f2')
  })
})

describe('consulta', () => {
  it('las fechas son días de Bogotá: desde las 00:00 hasta el final del día «hasta»', () => {
    const query = toSessionQuery({ ...emptyFilters, from: '2026-11-01', to: '2026-11-20' }, phases)
    expect(query.from).toBe('2026-11-01T05:00:00.000Z')
    expect(query.before).toBe('2026-11-21T05:00:00.000Z')
  })

  it('una fase incluye sus temas y su proyecto', () => {
    const query = toSessionQuery({ ...emptyFilters, phaseId: 'f1' }, phases)
    expect(query.phase?.id).toBe('f1')
    expect(query.phase?.topicIds).toContain('f1-t5')
    expect(query.target).toBeNull()
  })

  it('un tema o un proyecto concreto manda sobre la fase', () => {
    expect(
      toSessionQuery({ ...emptyFilters, phaseId: 'f1', targetKey: 'tema:f1-t5' }, phases),
    ).toMatchObject({ target: { topicId: 'f1-t5' }, phase: null })
    expect(
      toSessionQuery({ ...emptyFilters, phaseId: 'f1', targetKey: 'proyecto:f1' }, phases),
    ).toMatchObject({ target: { projectPhaseId: 'f1' }, phase: null })
  })

  it('ignora ids que no existen en la ruta', () => {
    expect(toSessionQuery({ ...emptyFilters, phaseId: 'f99' }, phases).phase).toBeNull()
  })

  it('las sesiones de un día van de 00:00 a 00:00 del día siguiente (Bogotá)', () => {
    expect(dayQuery('2026-11-17')).toMatchObject({
      from: '2026-11-17T05:00:00.000Z',
      before: '2026-11-18T05:00:00.000Z',
    })
  })
})
