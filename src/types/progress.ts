import type { Enums } from './database'

// Los tipos salen de la base (src/types/database.ts, generado). Las etiquetas están en lib/labels.ts.

export type ProgressStatus = Enums<'progress_status'>

export type StudyMode = Enums<'study_mode'>

/** Estado por id (de tema o de fase). Si falta un id, se considera pendiente. */
export type StatusMap = Readonly<Partial<Record<string, ProgressStatus>>>
