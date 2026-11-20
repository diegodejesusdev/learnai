import type { TutorErrorCode, TutorStreamEvent } from './tutorTypes.ts'

// La respuesta en streaming es NDJSON: un evento JSON por línea.

export function encodeEvent(event: TutorStreamEvent): string {
  return `${JSON.stringify(event)}\n`
}

const ERROR_CODES: readonly TutorErrorCode[] = [
  'rate_limit',
  'timeout',
  'auth',
  'unavailable',
  'refusal',
  'invalid_quiz',
  'bad_request',
  'config',
  'network',
  'unknown',
]

/** Valida un evento recibido. null si la línea no es un evento conocido. */
export function parseEvent(line: string): TutorStreamEvent | null {
  let data: unknown
  try {
    data = JSON.parse(line)
  } catch {
    return null
  }
  if (typeof data !== 'object' || data === null) return null
  const raw = data as Record<string, unknown>
  switch (raw.type) {
    case 'start':
      return typeof raw.conversationId === 'string' && typeof raw.userMessageId === 'string'
        ? { type: 'start', conversationId: raw.conversationId, userMessageId: raw.userMessageId }
        : null
    case 'delta':
      return typeof raw.text === 'string' ? { type: 'delta', text: raw.text } : null
    case 'done':
      return typeof raw.messageId === 'string' &&
        typeof raw.model === 'string' &&
        typeof raw.remaining === 'number'
        ? { type: 'done', messageId: raw.messageId, model: raw.model, remaining: raw.remaining }
        : null
    case 'error': {
      const code = ERROR_CODES.find((candidate) => candidate === raw.code) ?? 'unknown'
      return typeof raw.message === 'string' ? { type: 'error', code, message: raw.message } : null
    }
    default:
      return null
  }
}

/**
 * Junta los trozos que llegan por la red y devuelve los eventos completos.
 * Un trozo puede traer media línea o varias: lo que no termina en \n espera al siguiente.
 */
export function createEventDecoder() {
  let buffer = ''
  return {
    push(chunk: string): TutorStreamEvent[] {
      buffer += chunk
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      return lines.flatMap((line) => {
        const event = line.trim() ? parseEvent(line) : null
        return event ? [event] : []
      })
    },
    /** Al cerrar el stream: lo que quedó sin \n final. */
    flush(): TutorStreamEvent[] {
      const rest = buffer.trim()
      buffer = ''
      const event = rest ? parseEvent(rest) : null
      return event ? [event] : []
    },
  }
}
