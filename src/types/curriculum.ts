// Estructura de curriculum.json. Los nombres de campo siguen el JSON tal cual.

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

export interface Curriculum {
  version: number
  title: string
  goal: string
  phases: readonly Phase[]
  final_checklist: readonly ChecklistItem[]
}
