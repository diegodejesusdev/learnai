import { isAuthError, isAuthRetryableFetchError } from '@supabase/supabase-js'

const NO_ACCESS = 'Este correo no tiene acceso a LearnAI.'

const messagesByCode: Record<string, string> = {
  over_email_send_rate_limit: 'Ya pediste varios correos. Espera unos minutos antes de pedir otro.',
  over_request_rate_limit: 'Demasiados intentos seguidos. Espera un momento y vuelve a intentarlo.',
  otp_expired: 'El enlace o el código ya venció o ya se usó. Pide uno nuevo.',
  signup_disabled: NO_ACCESS,
  otp_disabled: NO_ACCESS,
  email_address_not_authorized: NO_ACCESS,
  email_address_invalid: 'Revisa el correo: parece que no es válido.',
  validation_failed: 'Revisa los datos e inténtalo de nuevo.',
  provider_disabled: 'El acceso con Google no está activado en Supabase.',
  email_provider_disabled: 'El acceso por correo no está activado en Supabase.',
  access_denied: 'No se completó el acceso. Inténtalo de nuevo.',
}

const FALLBACK = 'No pudimos iniciar sesión. Inténtalo de nuevo.'

export function messageForAuthCode(code: string | null | undefined): string {
  return (code && messagesByCode[code]) || FALLBACK
}

/** Traduce un error de Supabase Auth a un mensaje en español. */
export function authErrorMessage(error: unknown): string {
  if (
    isAuthRetryableFetchError(error) ||
    (error instanceof TypeError && /fetch/i.test(error.message))
  ) {
    return 'No hay conexión con el servidor. Revisa tu internet.'
  }
  if (isAuthError(error)) return messageForAuthCode(error.code)
  return FALLBACK
}

/**
 * Si el enlace mágico o Google volvieron con error, Supabase lo pone en la URL
 * (#error_code=otp_expired… o ?error=access_denied…). Devuelve el mensaje o null.
 */
export function authErrorFromUrl(href: string): string | null {
  const url = new URL(href)
  const params = new URLSearchParams(url.hash.slice(1))
  for (const [key, value] of url.searchParams) if (!params.has(key)) params.set(key, value)
  if (!params.has('error') && !params.has('error_code')) return null
  return messageForAuthCode(params.get('error_code') ?? params.get('error'))
}
