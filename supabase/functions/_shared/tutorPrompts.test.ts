import { describe, expect, it } from 'vitest'
import { buildSystemPrompt } from './tutorPrompts.ts'

const automation = { id: 'automatizacion', title: 'Automatización para negocios', goal: 'Vender' }
const data = { id: 'ingenieria-datos', title: 'Ingeniería de datos', goal: 'Empleo' }
const cloud = { id: 'cloud', title: 'Cloud', goal: 'Operar en la nube' }

describe('prompt de sistema', () => {
  it('lleva las instrucciones base, las del modo y el contexto al final', () => {
    const prompt = buildSystemPrompt('explain', [automation], '# Contexto del estudiante')
    expect(prompt.startsWith('Eres el tutor de LearnAI.')).toBe(true)
    expect(prompt).toContain('# Modo: Explicar')
    expect(prompt).toContain('Termina SIEMPRE con una sola pregunta')
    expect(prompt.endsWith('# Contexto del estudiante')).toBe(true)
  })

  it('pide verificar lo que puede estar desactualizado, en cualquier ruta', () => {
    for (const tracks of [[automation], [data], [cloud], [automation, data, cloud]]) {
      expect(buildSystemPrompt('explain', tracks, 'ctx')).toContain('documentación oficial')
    }
  })

  it('el quiz pide no repetir preguntas anteriores; los otros modos no', () => {
    const avoid = ['¿Qué es un webhook?']
    expect(buildSystemPrompt('quiz', [automation], 'ctx', { avoidQuestions: avoid })).toContain(
      '- ¿Qué es un webhook?',
    )
    expect(
      buildSystemPrompt('explain', [automation], 'ctx', { avoidQuestions: avoid }),
    ).not.toContain('¿Qué es un webhook?')
  })

  it('cada modo tiene sus instrucciones', () => {
    expect(buildSystemPrompt('project_review', [automation], 'ctx')).toContain(
      'No puedes abrir enlaces',
    )
    expect(buildSystemPrompt('daily_plan', [automation], 'ctx')).toContain('asume 45 minutos')
    expect(buildSystemPrompt('quiz', [automation], 'ctx')).toContain('5 preguntas')
  })
})

describe('con la lección del tema', () => {
  const lesson = { hasLesson: true }

  it('el quiz sale del contenido de la lección', () => {
    const prompt = buildSystemPrompt('quiz', [cloud], 'ctx', lesson)
    expect(prompt).toContain('Las 5 preguntas salen del contenido de la lección')
    expect(prompt).toContain('No preguntes por nada que la lección no diga')
    expect(prompt).toContain('No copies tal cual las preguntas de «Repaso»')
  })

  it('el enfoque que pida el estudiante se respeta dentro de la lección', () => {
    const prompt = buildSystemPrompt('quiz', [cloud], 'ctx', lesson)
    expect(prompt).toContain('dentro de lo que cubre la lección')
  })

  it('explicar se apoya en la lección, sin limitarse a ella', () => {
    const prompt = buildSystemPrompt('explain', [cloud], 'ctx', lesson)
    expect(prompt).toContain('Apóyate en la lección')
    expect(prompt).toContain('si vas más allá de la lección, dilo')
  })

  it('sin lección, o en otros modos, no se menciona', () => {
    for (const mode of ['explain', 'quiz'] as const) {
      expect(buildSystemPrompt(mode, [cloud], 'ctx')).not.toMatch(/lección/i)
      expect(buildSystemPrompt(mode, [cloud], 'ctx', { hasLesson: false })).not.toMatch(/lección/i)
    }
    for (const mode of ['project_review', 'daily_plan'] as const) {
      expect(buildSystemPrompt(mode, [cloud], 'ctx', lesson)).not.toMatch(/lección/i)
    }
  })
})

describe('se adapta a la ruta', () => {
  it('automatización conserva sus ejemplos de pequeños negocios', () => {
    const prompt = buildSystemPrompt('explain', [automation], 'ctx')
    expect(prompt).toContain('automatización para pequeños negocios en Colombia')
    expect(prompt).toContain('tienda de barrio')
    expect(prompt).not.toContain('ingeniería de datos')
  })

  it('ingeniería de datos no habla de tiendas de barrio en ningún modo', () => {
    for (const mode of ['explain', 'quiz', 'project_review', 'daily_plan'] as const) {
      const prompt = buildSystemPrompt(mode, [data], 'ctx')
      expect(prompt).toContain('ingeniería de datos')
      expect(prompt).not.toMatch(/tienda de barrio|pequeño negocio|pequeños negocios|nodo/)
    }
  })

  it('la revisión de un proyecto de datos mira lo que importa ahí', () => {
    const prompt = buildSystemPrompt('project_review', [data], 'ctx')
    expect(prompt).toMatch(/idempoten/)
    expect(prompt).toContain('Ley 1581')
  })

  it('cloud, en todos los modos: AWS, equivalencias, costos y borrar recursos', () => {
    for (const mode of ['explain', 'quiz', 'project_review', 'daily_plan'] as const) {
      const prompt = buildSystemPrompt(mode, [cloud], 'ctx')
      expect(prompt).toContain('AWS como nube principal')
      expect(prompt).toContain('equivalencias en Azure y Google Cloud')
      expect(prompt).toContain('Recuerdas SIEMPRE los costos')
      expect(prompt).toContain('cómo borrar')
      expect(prompt).not.toMatch(/tienda de barrio|pequeños negocios|datos abiertos/)
    }
  })

  it('el recordatorio de costos es solo de cloud', () => {
    for (const tracks of [[automation], [data], [automation, data]]) {
      expect(buildSystemPrompt('explain', tracks, 'ctx')).not.toMatch(/Recuerdas SIEMPRE|AWS/i)
    }
  })

  it('la revisión de un proyecto de cloud mira permisos, exposición y lo que sigue cobrando', () => {
    const prompt = buildSystemPrompt('project_review', [cloud], 'ctx')
    expect(prompt).toMatch(/permisos más amplios/)
    expect(prompt).toMatch(/recursos sin borrar/)
    expect(prompt).toContain('Ley 1581')
  })

  it('«Hoy» conoce las tres rutas y puede proponer de cualquiera', () => {
    const prompt = buildSystemPrompt('daily_plan', [automation, data, cloud], 'ctx')
    expect(prompt).toContain('«Automatización para negocios»')
    expect(prompt).toContain('«Ingeniería de datos»')
    // Lo de Cloud queda atado a Cloud: no cambia cómo habla de las otras dos.
    expect(prompt).toContain('- En «Cloud», trabajas con AWS como nube principal')
    expect(prompt).toContain('- En «Cloud», recuerdas SIEMPRE los costos')
    expect(prompt).toContain('Puedes proponer temas de cualquiera de sus rutas')
    expect(prompt).toContain('Di siempre de qué ruta es cada bloque')
  })

  it('«Hoy» con una sola ruta no habla de otras', () => {
    expect(buildSystemPrompt('daily_plan', [automation], 'ctx')).not.toContain(
      'cualquiera de sus rutas',
    )
  })
})
