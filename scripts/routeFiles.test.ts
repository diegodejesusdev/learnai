import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { loadRoutes, parseCurriculum, ROUTES_DIR } from './routeFiles.ts'

const valid = {
  version: 1,
  track: { id: 'diseno', title: 'Diseño', order: 3 },
  title: 'Ruta de diseño',
  goal: 'Aprender',
  phases: [
    {
      id: 'di-f0',
      order: 0,
      title: 'Bases',
      summary: '',
      estimated_weeks: 1,
      topics: [{ id: 'di-f0-t1', title: 'Color', details: '' }],
      project: { title: 'Paleta', description: '' },
    },
  ],
  final_checklist: [{ id: 'di-c1', text: 'Hago una paleta.' }],
}

describe('loadRoutes', () => {
  let dir: string
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'learnai-rutas-'))
  })
  afterEach(() => rm(dir, { recursive: true }))

  it('carga todas las rutas de la carpeta, por orden', async () => {
    const routes = await loadRoutes(ROUTES_DIR)
    expect(routes.map((route) => route.track.id)).toEqual(['automatizacion', 'ingenieria-datos'])
  })

  it('agregar una ruta es agregar un archivo', async () => {
    await writeFile(join(dir, 'tercera.json'), JSON.stringify(valid))
    await writeFile(
      join(dir, 'a-cuarta.json'),
      JSON.stringify({ ...valid, track: { id: 'cuarta', title: 'Cuarta', order: 4 } }),
    )
    await writeFile(join(dir, 'notas.txt'), 'no es una ruta')
    const routes = await loadRoutes(dir)
    expect(routes.map((route) => route.track.id)).toEqual(['diseno', 'cuarta'])
  })

  it('un JSON mal escrito dice en qué archivo está el problema', async () => {
    await writeFile(join(dir, 'rota.json'), '{ "version": 1,')
    await expect(loadRoutes(dir)).rejects.toThrow(/^rota\.json: no es un JSON válido/)
  })
})

describe('parseCurriculum', () => {
  it('acepta una ruta completa', () => {
    expect(parseCurriculum(valid, 'tercera.json')).toEqual(valid)
  })

  it('exige el bloque track', () => {
    expect(() => parseCurriculum({ ...valid, track: undefined }, 'tercera.json')).toThrow(
      'tercera.json: falta el bloque "track" con id, title y order.',
    )
    expect(() =>
      parseCurriculum({ ...valid, track: { ...valid.track, order: '3' } }, 'tercera.json'),
    ).toThrow('tercera.json: falta el bloque "track" con id, title y order.')
  })

  it('los ids solo llevan minúsculas, números y guiones (van en la URL)', () => {
    expect(() =>
      parseCurriculum({ ...valid, track: { ...valid.track, id: 'Diseño web' } }, 'tercera.json'),
    ).toThrow('tercera.json: el id «Diseño web» solo puede tener minúsculas, números y guiones.')
    expect(() =>
      parseCurriculum({ ...valid, final_checklist: [{ id: 'di,c1', text: 'x' }] }, 'tercera.json'),
    ).toThrow('tercera.json: el id «di,c1» solo puede tener minúsculas, números y guiones.')
  })

  it('exige fases con temas y proyecto, y la checklist', () => {
    expect(() => parseCurriculum({ ...valid, phases: undefined }, 'tercera.json')).toThrow(
      'tercera.json: falta la lista "phases".',
    )
    expect(() =>
      parseCurriculum({ ...valid, phases: [{ ...valid.phases[0], topics: null }] }, 'tercera.json'),
    ).toThrow('tercera.json: la fase di-f0 está incompleta.')
    expect(() => parseCurriculum({ ...valid, final_checklist: undefined }, 'tercera.json')).toThrow(
      'tercera.json: falta la lista "final_checklist".',
    )
  })
})
