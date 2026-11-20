import { QUIZ_QUESTIONS } from '@shared/quiz'

/** Mensaje según el puntaje. */
export function quizFeedback(score: number, total = QUIZ_QUESTIONS): string {
  if (score === total) return '¡Perfecto! Dominas este tema.'
  if (score >= total - 1) return 'Muy bien. Revisa la explicación de la que fallaste.'
  if (score >= Math.ceil(total / 2))
    return 'Vas bien. Repasa las explicaciones y vuelve a intentarlo.'
  return 'Este tema necesita un repaso: pídele al tutor que te lo explique y repite el quiz.'
}

/** Respuestas guardadas o vacías, siempre con una posición por pregunta. */
export function initialAnswers(
  saved: readonly number[] | undefined,
  total: number,
): (number | null)[] {
  return Array.from({ length: total }, (_, index) => saved?.[index] ?? null)
}
