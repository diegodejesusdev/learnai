import Anthropic from '@anthropic-ai/sdk'
import { quizJsonSchema } from '../_shared/quiz.ts'
import { errorCodeFromStatus, TutorError } from '../_shared/tutorErrors.ts'
import { MAX_OUTPUT_TOKENS, type ProviderRequest, type TutorProvider } from './providerTypes.ts'

// Modelos que aceptan el respaldo del lado del servidor (fallbacks: 'default'): si el modelo
// declina una solicitud, la API la reintenta en el modelo que Anthropic recomienda.
const SERVER_FALLBACK_MODELS = [
  'claude-fable-5-1',
  'claude-opus-5-5',
  'claude-opus-5',
  'claude-sonnet-5-5',
]

function toTutorError(error: unknown): TutorError {
  if (error instanceof TutorError) return error
  // El orden importa: los errores de conexión también son APIError en el SDK de TypeScript.
  if (error instanceof Anthropic.APIUserAbortError) return new TutorError('timeout')
  if (error instanceof Anthropic.APIConnectionTimeoutError) return new TutorError('timeout')
  if (error instanceof Anthropic.APIConnectionError) return new TutorError('network')
  if (error instanceof Anthropic.APIError && typeof error.status === 'number') {
    return new TutorError(errorCodeFromStatus(error.status))
  }
  return new TutorError('unknown')
}

export function anthropicProvider(apiKey: string, model: string): TutorProvider {
  // Un reintento automático ante 429/5xx; más alargaría la espera del usuario.
  const client = new Anthropic({ apiKey, maxRetries: 1 })
  const fallback = SERVER_FALLBACK_MODELS.includes(model)

  return {
    name: 'anthropic',
    model,
    async *stream(request: ProviderRequest) {
      try {
        const stream = client.beta.messages.stream(
          {
            model,
            max_tokens: MAX_OUTPUT_TOKENS,
            system: request.system,
            messages: request.messages,
            output_config: {
              effort: request.effort,
              ...(request.json ? { format: { type: 'json_schema', schema: quizJsonSchema } } : {}),
            },
            ...(fallback
              ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' }
              : {}),
          },
          { signal: request.signal },
        )
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            yield { type: 'text', text: event.delta.text }
          }
        }
        const message = await stream.finalMessage()
        if (message.stop_reason === 'refusal') throw new TutorError('refusal')
        yield {
          type: 'end',
          // Con respaldo, puede haber respondido otro modelo: se guarda el que respondió.
          model: message.model,
          inputTokens: message.usage.input_tokens,
          outputTokens: message.usage.output_tokens,
        }
      } catch (error) {
        throw toTutorError(error)
      }
    },
  }
}
