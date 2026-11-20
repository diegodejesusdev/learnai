import type { TutorErrorCode } from './tutorTypes.ts'

// Mensajes en español para los errores del proveedor y de la función.

export const errorMessages: Record<TutorErrorCode, string> = {
  rate_limit:
    'El proveedor de IA recibió demasiadas solicitudes o se agotó la cuota. Espera un minuto e inténtalo de nuevo.',
  timeout:
    'El tutor tardó demasiado en responder. Inténtalo de nuevo; si se repite, pide algo más corto.',
  auth: 'La clave de la IA no es válida o no tiene permisos. Revisa los secretos del tutor en Supabase.',
  unavailable:
    'El proveedor de IA está saturado o caído en este momento. Inténtalo de nuevo en unos minutos.',
  refusal: 'El tutor no pudo responder a esta solicitud. Prueba a reformularla.',
  invalid_quiz: 'El tutor devolvió un quiz con un formato inválido. Pídelo de nuevo.',
  bad_request:
    'El proveedor de IA rechazó la solicitud. Revisa que TUTOR_MODEL sea un modelo válido.',
  config:
    'El tutor no está configurado: falta la clave o el proveedor (TUTOR_PROVIDER) no es válido.',
  network:
    'No se pudo conectar con el proveedor de IA. Revisa la conexión del servidor e inténtalo de nuevo.',
  unknown: 'Algo falló al generar la respuesta. Inténtalo de nuevo.',
}

/** Error con un código conocido. Lo lanzan los adaptadores de proveedor y la función. */
export class TutorError extends Error {
  readonly code: TutorErrorCode
  constructor(code: TutorErrorCode, detail?: string) {
    super(detail ?? errorMessages[code])
    this.code = code
  }
}

/** Código de error a partir del status HTTP del proveedor. */
export function errorCodeFromStatus(status: number): TutorErrorCode {
  if (status === 429) return 'rate_limit'
  if (status === 401 || status === 403) return 'auth'
  if (status === 404) return 'bad_request'
  if (status === 408 || status === 504) return 'timeout'
  if (status >= 500) return 'unavailable'
  if (status >= 400) return 'bad_request'
  return 'unknown'
}

export const DEFAULT_DAILY_LIMIT = 50

/** TUTOR_DAILY_LIMIT, o 50 si falta o no es un entero positivo. */
export function dailyLimitFrom(value: string | undefined): number {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_DAILY_LIMIT
}

export function dailyLimitMessage(limit: number): string {
  return `Llegaste al límite de ${limit} mensajes al tutor por hoy. Se reinicia a la medianoche (hora de Colombia).`
}
