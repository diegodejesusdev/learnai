import { QUIZ_QUESTIONS, type Quiz } from '../_shared/quiz.ts'
import { TutorError } from '../_shared/tutorErrors.ts'
import type { ProviderRequest, TutorProvider } from './providerTypes.ts'

// Proveedor de prueba (TUTOR_PROVIDER=demo): respuestas fijas, sin clave y sin costo.
// Sirve para probar el chat, el streaming, el quiz y el límite diario en local.
// Para simular errores, incluye [error429] o [timeout] en el mensaje.

const demoQuiz: Quiz = {
  questions: Array.from({ length: QUIZ_QUESTIONS }, (_, index) => ({
    question: `Pregunta de prueba ${index + 1}: ¿qué hace un webhook en una tienda de barrio?`,
    options: [
      'Avisa a otra app cuando pasa algo, como un pedido nuevo',
      'Guarda las facturas en la DIAN',
      'Cobra a los clientes por WhatsApp',
      'Hace copias de seguridad del inventario',
    ],
    correctIndex: 0,
    explanation:
      'Un webhook es un aviso automático: la otra app llama a tu URL cuando ocurre algo.',
  })),
}

/** Algunas líneas del contexto que armó la función, para comprobar que llegan bien. */
function contextLines(system: string): string[] {
  const start = system.indexOf('# Contexto del estudiante')
  const context = system
    .slice(start === -1 ? system.length : start)
    // De la lección basta saber que llegó y qué tan larga es.
    .replace(/<leccion>[^]*<\/leccion>/, (lesson) => `Lección: ${lesson.length} caracteres`)
    .split('\n')
    .filter((line) =>
      /^(Ruta del|Tema:|Estado del tema:|Lección|Este tema aún|Proyecto:|## Progreso|Temas hechos:|Esta semana|- )/.test(
        line,
      ),
    )
    .map((line) => `> ${line.replace(/^- /, 'Sesión: ').replace(/^## /, '')}`)
  // La primera línea del prompt dice a qué ruta se adaptó.
  return [`> ${system.split('\n')[0] ?? ''}`, ...context.map((line) => `>\n${line}`)]
}

function demoAnswer(question: string, system: string): string {
  return [
    '## Respuesta de prueba',
    '',
    `Este es el proveedor **demo**: no llama a ninguna IA. Recibí tu mensaje: «${question.slice(0, 120)}».`,
    '',
    'Esto es parte del contexto que armó el servidor:',
    '',
    ...contextLines(system),
    '',
    'Así se ve una lista:',
    '',
    '- La panadería recibe un pedido por WhatsApp.',
    '- Un flujo de n8n lo guarda en Google Sheets.',
    '',
    'Y así un bloque de código:',
    '',
    '```json',
    '{ "pedido": 1024, "cliente": "Doña Rosa", "total": 18500 }',
    '```',
    '',
    '¿Qué dato del pedido usarías para avisarle al domiciliario?',
  ].join('\n')
}

function* pieces(text: string, size: number) {
  for (let index = 0; index < text.length; index += size) yield text.slice(index, index + size)
}

export function demoProvider(): TutorProvider {
  return {
    name: 'demo',
    model: 'demo',
    async *stream(request: ProviderRequest) {
      const last = request.messages.at(-1)?.content ?? ''
      if (last.includes('[error429]')) throw new TutorError('rate_limit')
      if (last.includes('[timeout]')) throw new TutorError('timeout')
      const text = request.json ? JSON.stringify(demoQuiz) : demoAnswer(last, request.system)
      for (const piece of pieces(text, 16)) {
        if (request.signal.aborted) throw new TutorError('timeout')
        await new Promise((resolve) => setTimeout(resolve, 30))
        yield { type: 'text', text: piece }
      }
      yield { type: 'end', model: 'demo', inputTokens: null, outputTokens: null }
    },
  }
}
