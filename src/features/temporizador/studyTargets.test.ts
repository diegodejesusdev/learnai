import { describe, expect, it } from 'vitest'
import { phases } from '@/data/curriculum'
import { searchTargets, studyTargets, targetKeyOf } from './studyTargets'

const targets = studyTargets(phases)

describe('studyTargets', () => {
  it('incluye los 100 temas y los 9 proyectos', () => {
    expect(targets.filter((target) => target.kind === 'topic')).toHaveLength(100)
    expect(targets.filter((target) => target.kind === 'project')).toHaveLength(9)
  })

  it('la clave sirve para tema y para proyecto', () => {
    expect(targetKeyOf({ topicId: 'f1-t5', projectPhaseId: null })).toBe('tema:f1-t5')
    expect(targetKeyOf({ topicId: null, projectPhaseId: 'f2' })).toBe('proyecto:f2')
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
})
