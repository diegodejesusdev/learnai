import { describe, expect, it } from 'vitest'
import { parseQuiz, quizQuestionTexts, quizScore, type Quiz } from './quiz.ts'

function question(n: number, correctIndex = n % 4) {
  return {
    question: `¿Pregunta ${n}?`,
    options: ['A', 'B', 'C', 'D'].map((letter) => `${letter}${n}`),
    correctIndex,
    explanation: `Porque sí ${n}`,
  }
}

const valid = { questions: [1, 2, 3, 4, 5].map((n) => question(n)) }

describe('parseQuiz', () => {
  it('acepta un quiz de 5 preguntas con 4 opciones', () => {
    const result = parseQuiz(JSON.stringify(valid))
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.quiz.questions[2]).toEqual(question(3))
  })

  it('acepta el JSON envuelto en un bloque ```json', () => {
    expect(parseQuiz('```json\n' + JSON.stringify(valid) + '\n```').ok).toBe(true)
  })

  it('rechaza JSON inválido sin lanzar', () => {
    expect(parseQuiz('{"questions": [')).toEqual({
      ok: false,
      error: 'El tutor no devolvió un JSON válido.',
    })
    expect(parseQuiz('Aquí tienes tu quiz: …').ok).toBe(false)
    expect(parseQuiz('')).toMatchObject({ ok: false })
  })

  it('rechaza un JSON válido con otra forma', () => {
    expect(parseQuiz('[]')).toEqual({ ok: false, error: 'El JSON no trae la lista de preguntas.' })
    expect(parseQuiz('null').ok).toBe(false)
    expect(parseQuiz('{"preguntas": []}').ok).toBe(false)
  })

  it('exige exactamente 5 preguntas', () => {
    const four = { questions: valid.questions.slice(0, 4) }
    expect(parseQuiz(JSON.stringify(four))).toEqual({
      ok: false,
      error: 'El quiz debe tener 5 preguntas y trae 4.',
    })
  })

  it('exige 4 opciones distintas con texto', () => {
    const three = {
      questions: [...valid.questions.slice(0, 4), { ...question(5), options: ['a', 'b', 'c'] }],
    }
    expect(parseQuiz(JSON.stringify(three))).toEqual({
      ok: false,
      error: 'La pregunta 5 debe tener 4 opciones con texto.',
    })
    const repeated = {
      questions: [{ ...question(1), options: ['a', 'a', 'b', 'c'] }, ...valid.questions.slice(1)],
    }
    expect(parseQuiz(JSON.stringify(repeated))).toMatchObject({
      ok: false,
      error: 'La pregunta 1 tiene opciones repetidas.',
    })
  })

  it('exige una respuesta correcta entre 0 y 3 y un enunciado', () => {
    for (const correctIndex of [4, -1, 1.5, '2', null]) {
      const bad = { questions: [{ ...question(1), correctIndex }, ...valid.questions.slice(1)] }
      expect(parseQuiz(JSON.stringify(bad))).toMatchObject({ ok: false })
    }
    const empty = { questions: [{ ...question(1), question: '  ' }, ...valid.questions.slice(1)] }
    expect(parseQuiz(JSON.stringify(empty))).toMatchObject({
      ok: false,
      error: 'La pregunta 1 no tiene enunciado.',
    })
  })

  it('la explicación es opcional y los textos se recortan', () => {
    const loose = {
      questions: [
        { ...question(1), question: '  ¿Qué es?  ', explanation: undefined },
        ...valid.questions.slice(1),
      ],
    }
    const result = parseQuiz(JSON.stringify(loose))
    expect(result.ok && result.quiz.questions[0]).toMatchObject({
      question: '¿Qué es?',
      explanation: '',
    })
  })
})

describe('puntaje', () => {
  it('cuenta las respuestas correctas; sin responder no suma', () => {
    const quiz: Quiz = valid
    const correct = quiz.questions.map((q) => q.correctIndex)
    expect(quizScore(quiz, correct)).toBe(5)
    expect(quizScore(quiz, [correct[0] ?? 0, null, null, null, null])).toBe(1)
    expect(quizScore(quiz, [])).toBe(0)
  })

  it('lista los enunciados de un quiz anterior (vacío si era inválido)', () => {
    expect(quizQuestionTexts(JSON.stringify(valid))).toHaveLength(5)
    expect(quizQuestionTexts('no es json')).toEqual([])
  })
})
