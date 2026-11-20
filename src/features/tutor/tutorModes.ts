import type { TutorMode } from '@shared/tutorTypes'

// Modos del tutor (docs/SPEC.md §4.4). Los valores coinciden con tutor_conversations.mode.

export interface TutorModeInfo {
  value: TutorMode
  /** Corto, para el selector de arriba (cabe a 360 px). */
  label: string
  description: string
}

export const tutorModes: readonly TutorModeInfo[] = [
  {
    value: 'explain',
    label: 'Explicar',
    description: 'Te explica el tema paso a paso y te pregunta para comprobar.',
  },
  {
    value: 'quiz',
    label: 'Quiz',
    description: '5 preguntas de opción múltiple con puntaje al final.',
  },
  {
    value: 'project_review',
    label: 'Proyecto',
    description: 'Pega tu solución y te dice qué cumple y qué falta del proyecto.',
  },
  {
    value: 'daily_plan',
    label: 'Hoy',
    description: '¿Qué estudio hoy? Un plan según tu progreso y tu tiempo.',
  },
]
