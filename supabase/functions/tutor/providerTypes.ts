// Interfaz común de los proveedores de IA: cambiar de proveedor no toca el resto de la función.

export interface ProviderMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ProviderRequest {
  system: string
  /** Historial y mensaje nuevo; empieza y termina con un mensaje del usuario. */
  messages: ProviderMessage[]
  /** true en el quiz: la respuesta debe seguir quizJsonSchema. */
  json: boolean
  /** Cuánto razonar: poco para conversar, más para el quiz y la revisión de proyectos. */
  effort: 'low' | 'medium'
  /** Se aborta si el usuario detiene la respuesta o si se acaba el tiempo. */
  signal: AbortSignal
}

export type ProviderChunk =
  | { type: 'text'; text: string }
  | { type: 'end'; model: string; inputTokens: number | null; outputTokens: number | null }

export interface TutorProvider {
  name: 'gemini' | 'anthropic' | 'demo'
  model: string
  stream(request: ProviderRequest): AsyncGenerator<ProviderChunk>
}

/** Respuestas largas caben de sobra; el límite real lo pone el tiempo de la Edge Function. */
export const MAX_OUTPUT_TOKENS = 16_000
