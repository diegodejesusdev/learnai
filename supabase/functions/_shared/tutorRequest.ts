import { MAX_MESSAGE_LENGTH, TUTOR_MODES, type TutorMode, type TutorRequest } from './tutorTypes.ts'

export type ParsedTutorRequest = { ok: true; request: TutorRequest } | { ok: false; error: string }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
// Ids de la ruta: «f1», «f1-t5» (letras, números y guiones).
const ROUTE_ID = /^[a-z0-9-]{1,40}$/i

function isMode(value: unknown): value is TutorMode {
  return typeof value === 'string' && (TUTOR_MODES as readonly string[]).includes(value)
}

function optionalId(value: unknown, pattern: RegExp): string | null | undefined {
  if (value === null || value === undefined) return null
  return typeof value === 'string' && pattern.test(value) ? value : undefined
}

/** Valida el cuerpo que llega a la función. Los errores van en español: los ve el usuario. */
export function parseTutorRequest(body: unknown): ParsedTutorRequest {
  if (typeof body !== 'object' || body === null) {
    return { ok: false, error: 'La solicitud no tiene el formato esperado.' }
  }
  const raw = body as Record<string, unknown>
  if (!isMode(raw.mode)) return { ok: false, error: 'Modo del tutor desconocido.' }
  const conversationId = optionalId(raw.conversationId, UUID)
  const topicId = optionalId(raw.topicId, ROUTE_ID)
  const phaseId = optionalId(raw.phaseId, ROUTE_ID)
  if (conversationId === undefined || topicId === undefined || phaseId === undefined) {
    return { ok: false, error: 'Algún identificador no es válido.' }
  }
  if (typeof raw.message !== 'string' || raw.message.trim() === '') {
    return { ok: false, error: 'Escribe un mensaje para el tutor.' }
  }
  const message = raw.message.trim()
  if (message.length > MAX_MESSAGE_LENGTH) {
    return {
      ok: false,
      error: `El mensaje es muy largo (máximo ${MAX_MESSAGE_LENGTH.toLocaleString('es-CO')} caracteres).`,
    }
  }

  const mode = raw.mode
  // Cada modo va ligado a lo suyo, igual que el check de tutor_conversations.
  if ((mode === 'explain' || mode === 'quiz') && (topicId === null || phaseId !== null)) {
    return { ok: false, error: 'Elige un tema.' }
  }
  if (mode === 'project_review' && (phaseId === null || topicId !== null)) {
    return { ok: false, error: 'Elige un proyecto.' }
  }
  if (mode === 'daily_plan' && (topicId !== null || phaseId !== null)) {
    return { ok: false, error: '«¿Qué estudio hoy?» no va ligado a un tema.' }
  }
  return { ok: true, request: { conversationId, mode, topicId, phaseId, message } }
}
