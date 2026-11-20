import { describe, expect, it } from 'vitest'
import { BASE_INSTRUCTIONS, buildSystemPrompt } from './tutorPrompts.ts'

describe('prompt de sistema', () => {
  it('lleva las instrucciones base, las del modo y el contexto al final', () => {
    const prompt = buildSystemPrompt('explain', '# Contexto del estudiante')
    expect(prompt.startsWith(BASE_INSTRUCTIONS)).toBe(true)
    expect(prompt).toContain('# Modo: Explicar')
    expect(prompt).toContain('Termina SIEMPRE con una sola pregunta')
    expect(prompt.endsWith('# Contexto del estudiante')).toBe(true)
  })

  it('pide verificar lo que puede estar desactualizado y ejemplos colombianos', () => {
    expect(BASE_INSTRUCTIONS).toContain('documentación oficial')
    expect(BASE_INSTRUCTIONS).toContain('pequeños negocios colombianos')
  })

  it('el quiz pide no repetir preguntas anteriores; los otros modos no', () => {
    const avoid = ['¿Qué es un webhook?']
    expect(buildSystemPrompt('quiz', 'ctx', { avoidQuestions: avoid })).toContain(
      '- ¿Qué es un webhook?',
    )
    expect(buildSystemPrompt('explain', 'ctx', { avoidQuestions: avoid })).not.toContain(
      '¿Qué es un webhook?',
    )
  })

  it('cada modo tiene sus instrucciones', () => {
    expect(buildSystemPrompt('project_review', 'ctx')).toContain('No puedes abrir enlaces')
    expect(buildSystemPrompt('daily_plan', 'ctx')).toContain('asume 45 minutos')
    expect(buildSystemPrompt('quiz', 'ctx')).toContain('5 preguntas')
  })
})
