// Tipos que comparten la Edge Function `tutor` y la app (alias @shared en Vite).
// Este archivo y los demás de _shared no usan nada de Deno ni del navegador: así se prueban
// con Vitest y corren igual en los dos lados.

/** Coincide con el enum tutor_mode de la base. */
export type TutorMode = 'explain' | 'quiz' | 'project_review' | 'daily_plan'

export const TUTOR_MODES: readonly TutorMode[] = ['explain', 'quiz', 'project_review', 'daily_plan']

/** Lo que la app envía a la función en cada mensaje. */
export interface TutorRequest {
  /** null = conversación nueva (la función la crea). */
  conversationId: string | null
  mode: TutorMode
  /** Explicar y Quiz van ligados a un tema. */
  topicId: string | null
  /** Revisar proyecto va ligado a la fase del proyecto. */
  phaseId: string | null
  message: string
}

/** Largo máximo de un mensaje: alcanza para pegar un README o un flujo de n8n. */
export const MAX_MESSAGE_LENGTH = 20_000

/**
 * Eventos de la respuesta en streaming: uno por línea, en JSON (NDJSON).
 * start → delta… → done, o error en cualquier momento.
 */
export type TutorStreamEvent =
  | { type: 'start'; conversationId: string; userMessageId: string }
  | { type: 'delta'; text: string }
  | { type: 'done'; messageId: string; model: string; remaining: number }
  | { type: 'error'; code: TutorErrorCode; message: string }

export type TutorErrorCode =
  | 'rate_limit'
  | 'timeout'
  | 'auth'
  | 'unavailable'
  | 'refusal'
  | 'invalid_quiz'
  | 'bad_request'
  | 'config'
  | 'network'
  | 'unknown'
