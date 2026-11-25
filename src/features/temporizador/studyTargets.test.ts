import { describe, expect, it } from 'vitest'
import { automationTrack, cloudTrack, dataTrack, tracks } from '@/data/curriculum'
import { activeFirst } from '@/lib/roadmap'
import {
  searchByTrack,
  searchTargets,
  studyTargets,
  targetKeyOf,
  targetTitle,
} from './studyTargets'

const targets = studyTargets([automationTrack])
const all = studyTargets(tracks)

describe('studyTargets', () => {
  it('automatización: los 100 temas y los 9 proyectos', () => {
    expect(targets.filter((target) => target.kind === 'topic')).toHaveLength(100)
    expect(targets.filter((target) => target.kind === 'project')).toHaveLength(9)
  })

  it('con las tres rutas, los 332 temas y los 36 proyectos', () => {
    expect(all.filter((target) => target.kind === 'topic')).toHaveLength(332)
    expect(all.filter((target) => target.kind === 'project')).toHaveLength(36)
  })

  it('cada uno dice de qué ruta es', () => {
    expect(all.find((target) => target.key === 'tema:de-f1-t4')).toMatchObject({
      trackId: 'ingenieria-datos',
      trackTitle: 'Ingeniería de datos',
      context: 'Ingeniería de datos · Fase 1 · SQL avanzado y modelado de datos',
    })
    expect(all.find((target) => target.key === 'proyecto:f1')?.context).toBe(
      'Automatización para negocios · Proyecto · Fase 1',
    )
  })

  it('la clave sirve para tema y para proyecto', () => {
    expect(targetKeyOf({ topicId: 'f1-t5', projectPhaseId: null })).toBe('tema:f1-t5')
    expect(targetKeyOf({ topicId: null, projectPhaseId: 'f2' })).toBe('proyecto:f2')
  })

  it('el título se encuentra en cualquier ruta', () => {
    expect(targetTitle(tracks, { topicId: 'f1-t5', projectPhaseId: null })).toBe('Webhooks')
    expect(targetTitle(tracks, { topicId: null, projectPhaseId: 'de-f1' })).toBe('Modelo estrella')
    expect(targetTitle(tracks, { topicId: 'no-existe', projectPhaseId: null })).toBeUndefined()
  })
})

describe('buscador por nombre', () => {
  it('ignora tildes y mayúsculas', () => {
    expect(searchTargets(targets, 'FACTURACION').map((target) => target.title)).toContain(
      'Facturación electrónica DIAN',
    )
  })

  it('exige todas las palabras', () => {
    expect(searchTargets(targets, 'n8n errores').map((target) => target.title)).toEqual([
      'n8n: manejo de errores',
    ])
  })

  it('encuentra proyectos y pone primero las coincidencias en el título', () => {
    const results = searchTargets(targets, 'webhook')
    expect(results[0]?.title).toBe('Webhooks')
    expect(
      results.some(
        (target) => target.kind === 'project' && target.title === 'Primera API y webhook',
      ),
    ).toBe(true)
  })

  it('sin texto no devuelve nada y respeta el límite', () => {
    expect(searchTargets(targets, '   ')).toEqual([])
    expect(searchTargets(targets, 'n8n', 3)).toHaveLength(3)
  })

  it('el nombre de la ruta no cuenta como coincidencia: «datos» no trae los 110 temas', () => {
    const results = searchTargets(all, 'datos', 500)
    expect(results.some((target) => target.key === 'tema:de-f8-t3')).toBe(false)
  })
})

describe('buscador agrupado por ruta', () => {
  it('muestra las tres rutas, cada una con su título', () => {
    const groups = searchByTrack(all, 'api')
    expect(groups.map((group) => group.title)).toEqual([
      'Automatización para negocios',
      'Ingeniería de datos',
      'Cloud',
    ])
    expect(groups[1]?.results.map((target) => target.title)).toContain('APIs desde Python')
    expect(groups[2]?.results.map((target) => target.title)).toEqual([
      'API Gateway',
      'Una API, tres despliegues',
    ])
  })

  it('la ruta activa va primero', () => {
    const ordered = studyTargets(activeFirst(tracks, dataTrack.id))
    expect(searchByTrack(ordered, 'api').map((group) => group.trackId)).toEqual([
      'ingenieria-datos',
      'automatizacion',
      'cloud',
    ])
    const cloudFirst = studyTargets(activeFirst(tracks, cloudTrack.id))
    expect(searchByTrack(cloudFirst, 'api')[0]?.trackId).toBe('cloud')
  })

  it('el límite es por ruta: una no tapa a la otra', () => {
    const groups = searchByTrack(all, 'fase', 2)
    expect(groups.map((group) => group.results.length)).toEqual([2, 2, 2])
  })

  it('una ruta sin resultados no aparece', () => {
    expect(searchByTrack(all, 'kafka').map((group) => group.trackId)).toEqual(['ingenieria-datos'])
    expect(searchByTrack(all, 'n8n').map((group) => group.trackId)).toEqual(['automatizacion'])
    expect(searchByTrack(all, 'iam').map((group) => group.trackId)).toEqual(['cloud'])
    expect(searchByTrack(all, '  ')).toEqual([])
  })
})
