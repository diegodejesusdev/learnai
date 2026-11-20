// Quiz: 5 preguntas de opción múltiple que el modelo devuelve como JSON con un esquema fijo.

export const QUIZ_QUESTIONS = 5
export const QUIZ_OPTIONS = 4

export interface QuizQuestion {
  question: string
  options: string[]
  /** Índice de la opción correcta (0 a 3). */
  correctIndex: number
  /** Por qué esa es la correcta; se muestra al responder. */
  explanation: string
}

export interface Quiz {
  questions: QuizQuestion[]
}

/**
 * Esquema que se pide al modelo. Solo usa lo que aceptan los dos proveedores (Anthropic no
 * admite minItems/maxItems ni minimum/maximum); los conteos los revisa parseQuiz.
 */
export const quizJsonSchema = {
  type: 'object',
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          question: { type: 'string' },
          options: { type: 'array', items: { type: 'string' } },
          correctIndex: { type: 'integer', enum: [0, 1, 2, 3] },
          explanation: { type: 'string' },
        },
        required: ['question', 'options', 'correctIndex', 'explanation'],
        additionalProperties: false,
      },
    },
  },
  required: ['questions'],
  additionalProperties: false,
} as const

export type ParsedQuiz = { ok: true; quiz: Quiz } | { ok: false; error: string }

function nonEmpty(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== ''
}

function parseQuestion(value: unknown, index: number): QuizQuestion | string {
  const label = `La pregunta ${index + 1}`
  if (typeof value !== 'object' || value === null) return `${label} no tiene el formato esperado.`
  const raw = value as Record<string, unknown>
  if (!nonEmpty(raw.question)) return `${label} no tiene enunciado.`
  if (
    !Array.isArray(raw.options) ||
    raw.options.length !== QUIZ_OPTIONS ||
    !raw.options.every(nonEmpty)
  ) {
    return `${label} debe tener ${QUIZ_OPTIONS} opciones con texto.`
  }
  const options = raw.options.map((option) => option.trim())
  if (new Set(options).size !== options.length) return `${label} tiene opciones repetidas.`
  const correctIndex = raw.correctIndex
  if (
    typeof correctIndex !== 'number' ||
    !Number.isInteger(correctIndex) ||
    correctIndex < 0 ||
    correctIndex >= QUIZ_OPTIONS
  ) {
    return `${label} no indica bien la respuesta correcta.`
  }
  return {
    question: raw.question.trim(),
    options,
    correctIndex,
    explanation: nonEmpty(raw.explanation) ? raw.explanation.trim() : '',
  }
}

/** Quita un bloque ```json … ``` si el modelo lo envolvió así. */
function stripCodeFence(text: string): string {
  const fenced = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(text.trim())
  return fenced?.[1] ?? text.trim()
}

/** Valida el JSON del quiz. Nunca lanza: devuelve el error en español. */
export function parseQuiz(text: string): ParsedQuiz {
  let data: unknown
  try {
    data = JSON.parse(stripCodeFence(text))
  } catch {
    return { ok: false, error: 'El tutor no devolvió un JSON válido.' }
  }
  if (typeof data !== 'object' || data === null || !Array.isArray((data as Quiz).questions)) {
    return { ok: false, error: 'El JSON no trae la lista de preguntas.' }
  }
  const rawQuestions: unknown[] = (data as { questions: unknown[] }).questions
  if (rawQuestions.length !== QUIZ_QUESTIONS) {
    return {
      ok: false,
      error: `El quiz debe tener ${QUIZ_QUESTIONS} preguntas y trae ${rawQuestions.length}.`,
    }
  }
  const questions: QuizQuestion[] = []
  for (const [index, raw] of rawQuestions.entries()) {
    const question = parseQuestion(raw, index)
    if (typeof question === 'string') return { ok: false, error: question }
    questions.push(question)
  }
  return { ok: true, quiz: { questions } }
}

/** Puntaje: cuántas respuestas coinciden con la correcta. */
export function quizScore(quiz: Quiz, answers: readonly (number | null)[]): number {
  return quiz.questions.filter((question, index) => answers[index] === question.correctIndex).length
}

/** Enunciados de un quiz anterior, para pedir que no se repitan. */
export function quizQuestionTexts(text: string): string[] {
  const parsed = parseQuiz(text)
  return parsed.ok ? parsed.quiz.questions.map((question) => question.question) : []
}
