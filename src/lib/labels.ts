import { Constants } from '@/types/database'
import type { ProgressStatus, StudyMode } from '@/types/progress'

/** En el orden en que se muestran: pendiente → en curso → hecho. */
export const PROGRESS_STATUSES: readonly ProgressStatus[] = Constants.public.Enums.progress_status

export const statusLabels: Record<ProgressStatus, string> = {
  pendiente: 'Pendiente',
  en_curso: 'En curso',
  hecho: 'Hecho',
}

export const studyModeLabels: Record<StudyMode, string> = {
  pomodoro: 'Pomodoro',
  free: 'Libre',
  manual: 'Manual',
}
