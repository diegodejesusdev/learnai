import { AuthApiError, AuthRetryableFetchError } from '@supabase/supabase-js'
import { describe, expect, it } from 'vitest'
import { authErrorFromUrl, authErrorMessage } from './authErrors'

describe('authErrorMessage', () => {
  it('traduce los códigos conocidos', () => {
    const error = new AuthApiError('Email rate limit exceeded', 429, 'over_email_send_rate_limit')
    expect(authErrorMessage(error)).toBe(
      'Ya pediste varios correos. Espera unos minutos antes de pedir otro.',
    )
  })

  it('registro desactivado = sin acceso', () => {
    const error = new AuthApiError('Signups not allowed for otp', 422, 'otp_disabled')
    expect(authErrorMessage(error)).toBe('Este correo no tiene acceso a LearnAI.')
  })

  it('sin conexión', () => {
    expect(authErrorMessage(new AuthRetryableFetchError('Failed to fetch', 0))).toBe(
      'No hay conexión con el servidor. Revisa tu internet.',
    )
  })

  it('cualquier otro error da un mensaje genérico en español', () => {
    expect(authErrorMessage(new Error('boom'))).toBe(
      'No pudimos iniciar sesión. Inténtalo de nuevo.',
    )
  })
})

describe('authErrorFromUrl', () => {
  it('lee el error del hash que deja un enlace vencido', () => {
    const href =
      'http://localhost:5173/login#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid'
    expect(authErrorFromUrl(href)).toBe(
      'El enlace o el código ya venció o ya se usó. Pide uno nuevo.',
    )
  })

  it('lee el error de la query (Google cancelado)', () => {
    expect(authErrorFromUrl('http://localhost:5173/login?error=access_denied')).toBe(
      'No se completó el acceso. Inténtalo de nuevo.',
    )
  })

  it('sin error devuelve null (incluido un hash con tokens)', () => {
    expect(
      authErrorFromUrl('http://localhost:5173/login#access_token=abc&type=magiclink'),
    ).toBeNull()
  })
})
