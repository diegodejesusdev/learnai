import { TutorError } from '../_shared/tutorErrors.ts'
import { anthropicProvider } from './anthropic.ts'
import { demoProvider } from './demo.ts'
import { geminiProvider } from './gemini.ts'
import type { TutorProvider } from './providerTypes.ts'

/**
 * Modelos por defecto si TUTOR_MODEL está vacío. Revisados en la documentación de cada
 * proveedor el 20 nov 2026 (ver .env.example).
 */
export const DEFAULT_MODELS = {
  gemini: 'gemini-4-hydrogen',
  anthropic: 'claude-opus-5-5',
} as const

/** Elige el proveedor según TUTOR_PROVIDER (gemini por defecto). Sin clave: error de configuración. */
export function createProvider(env: (name: string) => string | undefined): TutorProvider {
  const provider = (env('TUTOR_PROVIDER') ?? 'gemini').trim().toLowerCase() || 'gemini'
  const model = env('TUTOR_MODEL')?.trim()
  if (provider === 'gemini') {
    const key = env('GEMINI_API_KEY')
    if (!key) throw new TutorError('config', 'Falta GEMINI_API_KEY en los secretos del tutor.')
    return geminiProvider(key, model || DEFAULT_MODELS.gemini)
  }
  if (provider === 'anthropic') {
    const key = env('ANTHROPIC_API_KEY')
    if (!key) throw new TutorError('config', 'Falta ANTHROPIC_API_KEY en los secretos del tutor.')
    return anthropicProvider(key, model || DEFAULT_MODELS.anthropic)
  }
  if (provider === 'demo') return demoProvider()
  throw new TutorError(
    'config',
    `TUTOR_PROVIDER «${provider}» no es válido: usa gemini o anthropic.`,
  )
}
