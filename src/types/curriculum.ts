// Estructura de los archivos de src/data/routes/. Los nombres de campo siguen el JSON tal cual.

export interface Topic {
  id: string
  title: string
  details: string
}

export interface PhaseProject {
  title: string
  description: string
}

export interface Phase {
  id: string
  order: number
  title: string
  summary: string
  estimated_weeks: number
  topics: readonly Topic[]
  project: PhaseProject
}

export interface ChecklistItem {
  id: string
  text: string
}

/** La ruta a la que pertenece el archivo. `order` decide en qué orden se muestran las rutas. */
export interface CurriculumTrack {
  id: string
  title: string
  order: number
}

export interface Curriculum {
  version: number
  track: CurriculumTrack
  title: string
  goal: string
  phases: readonly Phase[]
  final_checklist: readonly ChecklistItem[]
}
