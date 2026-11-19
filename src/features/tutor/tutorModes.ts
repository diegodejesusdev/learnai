import {
  CalendarClock,
  ClipboardCheck,
  GraduationCap,
  Lightbulb,
  type LucideIcon,
} from 'lucide-react'

// Modos del tutor (docs/SPEC.md §4.4). Los valores coinciden con tutor_conversations.mode.
export type TutorMode = 'explain' | 'quiz' | 'project_review' | 'daily_plan'

export interface TutorModeInfo {
  value: TutorMode
  label: string
  description: string
  icon: LucideIcon
}

export const tutorModes: readonly TutorModeInfo[] = [
  {
    value: 'explain',
    label: 'Explicar',
    description: 'Un tema con ejemplos de negocios',
    icon: Lightbulb,
  },
  {
    value: 'quiz',
    label: 'Quiz',
    description: 'Preguntas para ponerte a prueba',
    icon: GraduationCap,
  },
  {
    value: 'project_review',
    label: 'Revisar proyecto',
    description: 'Retroalimentación de tu proyecto',
    icon: ClipboardCheck,
  },
  {
    value: 'daily_plan',
    label: 'Qué estudiar hoy',
    description: 'Sugerencia según tu progreso',
    icon: CalendarClock,
  },
]
