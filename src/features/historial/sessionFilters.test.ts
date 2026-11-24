import { describe, expect, it } from 'vitest'
import { tracks } from '@/data/curriculum'
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
      trackId: '',
      phaseId: 'f1',
      targetKey: 'tema:f1-t5',
    })
  })

  it('lee la ruta', () => {
    expect(readSessionFilters(new URLSearchParams('ruta=ingenieria-datos')).trackId).toBe(
      'ingenieria-datos',
    )
    expect(hasFilters({ ...emptyFilters, trackId: 'ingenieria-datos' })).toBe(true)
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

  it('escribe y quita la ruta', () => {
    const params = new URLSearchParams('dia=2026-11-18')
    const withTrack = writeSessionFilters(params, { ...emptyFilters, trackId: 'automatizacion' })
    expect(withTrack.toString()).toBe('dia=2026-11-18&ruta=automatizacion')
    expect(writeSessionFilters(withTrack, emptyFilters).toString()).toBe('dia=2026-11-18')
  })
})

describe('consulta', () => {
  it('las fechas son días de Bogotá: desde las 00:00 hasta el final del día «hasta»', () => {
    const query = toSessionQuery({ ...emptyFilters, from: '2026-11-01', to: '2026-11-20' }, tracks)
    expect(query.from).toBe('2026-11-01T05:00:00.000Z')
    expect(query.before).toBe('2026-11-21T05:00:00.000Z')
  })

  it('una fase incluye sus temas y su proyecto', () => {
    const query = toSessionQuery({ ...emptyFilters, phaseId: 'f1' }, tracks)
    expect(query.scope?.phaseIds).toEqual(['f1'])
    expect(query.scope?.topicIds).toContain('f1-t5')
    expect(query.target).toBeNull()
  })

  it('un tema o un proyecto concreto manda sobre la fase', () => {
    expect(
      toSessionQuery({ ...emptyFilters, phaseId: 'f1', targetKey: 'tema:f1-t5' }, tracks),
    ).toMatchObject({ target: { topicId: 'f1-t5' }, scope: null })
    expect(
      toSessionQuery({ ...emptyFilters, phaseId: 'f1', targetKey: 'proyecto:f1' }, tracks),
    ).toMatchObject({ target: { projectPhaseId: 'f1' }, scope: null })
  })

  it('ignora ids que no existen en la ruta', () => {
    expect(toSessionQuery({ ...emptyFilters, phaseId: 'f99' }, tracks).scope).toBeNull()
    expect(toSessionQuery({ ...emptyFilters, trackId: 'no-existe' }, tracks).scope).toBeNull()
  })

  it('una ruta incluye todas sus fases y todos sus temas, y ninguno de la otra', () => {
    const { scope } = toSessionQuery({ ...emptyFilters, trackId: 'ingenieria-datos' }, tracks)
    expect(scope?.phaseIds).toHaveLength(13)
    expect(scope?.topicIds).toHaveLength(110)
    expect(scope?.topicIds.every((id) => id.startsWith('de-'))).toBe(true)
  })

  it('dentro de una ruta, la fase o el tema mandan; los de otra ruta se ignoran', () => {
    const inData = { ...emptyFilters, trackId: 'ingenieria-datos' }
    expect(toSessionQuery({ ...inData, phaseId: 'de-f1' }, tracks).scope?.phaseIds).toEqual([
      'de-f1',
    ])
    expect(toSessionQuery({ ...inData, phaseId: 'f1' }, tracks).scope?.phaseIds).toHaveLength(13)
    expect(toSessionQuery({ ...inData, targetKey: 'tema:f1-t5' }, tracks)).toMatchObject({
      target: null,
      scope: { phaseIds: expect.arrayContaining(['de-f0']) as string[] },
    })
  })

  it('las sesiones de un día van de 00:00 a 00:00 del día siguiente (Bogotá)', () => {
    expect(dayQuery('2026-11-17')).toMatchObject({
      from: '2026-11-17T05:00:00.000Z',
      before: '2026-11-18T05:00:00.000Z',
    })
  })
})
