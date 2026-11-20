import type { TutorMode } from '@shared/tutorTypes'
import type { TutorTarget } from './tutorApi'

// Lo que se elige en el Tutor va en la URL (?modo=quiz&tema=f1-t5&conversacion=…):
// los enlaces desde Ruta e Inicio abren lo correcto y recargar no pierde la conversación.

export type ModeSlug = 'explicar' | 'quiz' | 'proyecto' | 'hoy'

export const modeBySlug: Record<ModeSlug, TutorMode> = {
  explicar: 'explain',
  quiz: 'quiz',
  proyecto: 'project_review',
  hoy: 'daily_plan',
}

export const slugByMode: Record<TutorMode, ModeSlug> = {
  explain: 'explicar',
  quiz: 'quiz',
  project_review: 'proyecto',
  daily_plan: 'hoy',
}

/** 'latest' = la más reciente de ese tema y modo (o una nueva si no hay ninguna). */
export type ConversationChoice = 'latest' | 'new' | { id: string }

export interface TutorUrlState {
  mode: TutorMode
  topicId: string
  phaseId: string
  conversation: ConversationChoice
}

interface Defaults {
  topicId: string
  phaseId: string
  isTopic: (id: string) => boolean
  isPhase: (id: string) => boolean
}

function isSlug(value: string | null): value is ModeSlug {
  return value !== null && value in modeBySlug
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function readTutorUrl(params: URLSearchParams, defaults: Defaults): TutorUrlState {
  const slug = params.get('modo')
  const topic = params.get('tema')
  const project = params.get('proyecto')
  // Sin modo: un enlace con ?proyecto= viene de «Revisar con el tutor».
  const mode = isSlug(slug) ? modeBySlug[slug] : project && !topic ? 'project_review' : 'explain'
  const conversation = params.get('conversacion')
  return {
    mode,
    topicId: topic && defaults.isTopic(topic) ? topic : defaults.topicId,
    phaseId: project && defaults.isPhase(project) ? project : defaults.phaseId,
    conversation:
      conversation === 'nueva'
        ? 'new'
        : conversation && UUID.test(conversation)
          ? { id: conversation }
          : 'latest',
  }
}

export function writeTutorUrl(state: TutorUrlState): URLSearchParams {
  const params = new URLSearchParams({
    modo: slugByMode[state.mode],
    tema: state.topicId,
    proyecto: state.phaseId,
  })
  if (state.conversation === 'new') params.set('conversacion', 'nueva')
  else if (state.conversation !== 'latest') params.set('conversacion', state.conversation.id)
  return params
}

/** El tema o proyecto al que va ligada la conversación según el modo. */
export function targetOf(state: TutorUrlState): TutorTarget {
  if (state.mode === 'explain' || state.mode === 'quiz') {
    return { mode: state.mode, topicId: state.topicId, phaseId: null }
  }
  if (state.mode === 'project_review')
    return { mode: state.mode, topicId: null, phaseId: state.phaseId }
  return { mode: state.mode, topicId: null, phaseId: null }
}
