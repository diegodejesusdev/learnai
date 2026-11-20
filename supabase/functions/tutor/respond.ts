import { parseQuiz } from '../_shared/quiz.ts'
import { errorMessages, TutorError } from '../_shared/tutorErrors.ts'
import { encodeEvent } from '../_shared/tutorStream.ts'
import type { TutorRequest, TutorStreamEvent } from '../_shared/tutorTypes.ts'
import * as data from './data.ts'
import type { ProviderChunk, ProviderMessage, TutorProvider } from './providerTypes.ts'

/** Tiempo máximo de una respuesta; la Edge Function corta a los 150 s en el plan gratuito. */
const TIMEOUT_MS = 120_000

export interface AnswerInput {
  db: data.Db
  provider: TutorProvider
  request: TutorRequest
  conversationId: string
  isNewConversation: boolean
  userMessageId: string
  system: string
  messages: ProviderMessage[]
  /** Mensajes que le quedan hoy después de este. */
  remaining: number
}

/**
 * Respuesta en streaming (NDJSON): start, delta…, y done o error.
 * Si falla, borra la pregunta (y la conversación, si era nueva): no queda una pregunta sin
 * respuesta ni cuenta para el límite, y la app conserva el texto para reintentar.
 */
export function streamAnswer(input: AnswerInput): Response {
  const { db, provider, request, conversationId, userMessageId } = input
  const encoder = new TextEncoder()
  const stopped = new AbortController()
  const timeout = AbortSignal.timeout(TIMEOUT_MS)
  const signal = AbortSignal.any([stopped.signal, timeout])

  const saveAnswer = async (content: string, end: ProviderChunk | null) => {
    const id = await data.insertMessage(db, {
      conversation_id: conversationId,
      role: 'assistant',
      content,
      model: end?.type === 'end' ? end.model : provider.model,
      tokens_in: end?.type === 'end' ? end.inputTokens : null,
      tokens_out: end?.type === 'end' ? end.outputTokens : null,
    })
    await data.touchConversation(db, conversationId)
    return { id, model: end?.type === 'end' ? end.model : provider.model }
  }

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: TutorStreamEvent) => {
        try {
          controller.enqueue(encoder.encode(encodeEvent(event)))
        } catch {
          // El navegador ya cerró la conexión.
        }
      }
      send({ type: 'start', conversationId, userMessageId })

      let text = ''
      let end: ProviderChunk | null = null
      try {
        const chunks = provider.stream({
          system: input.system,
          messages: input.messages,
          json: request.mode === 'quiz',
          effort: request.mode === 'quiz' || request.mode === 'project_review' ? 'medium' : 'low',
          signal,
        })
        for await (const chunk of chunks) {
          if (chunk.type === 'text') {
            text += chunk.text
            send({ type: 'delta', text: chunk.text })
          } else {
            end = chunk
          }
        }
        if (request.mode === 'quiz' && !parseQuiz(text).ok) throw new TutorError('invalid_quiz')
        if (text.trim() === '') throw new TutorError('unknown')
        const saved = await saveAnswer(text, end)
        send({ type: 'done', messageId: saved.id, model: saved.model, remaining: input.remaining })
      } catch (error) {
        if (stopped.signal.aborted && text.trim() !== '' && request.mode !== 'quiz') {
          // Lo detuviste tú: se guarda lo que alcanzó a escribir.
          await saveAnswer(text, end).catch(() => undefined)
        } else {
          await data.deleteMessage(db, userMessageId).catch(() => undefined)
          if (input.isNewConversation) {
            await data.deleteConversation(db, conversationId).catch(() => undefined)
          }
          const tutorError = error instanceof TutorError ? error : new TutorError('unknown')
          const code = timeout.aborted ? 'timeout' : tutorError.code
          // Solo el código, nunca el contenido de la conversación.
          console.error('tutor: falló la respuesta', code, provider.name, provider.model)
          send({
            type: 'error',
            code,
            message: timeout.aborted ? errorMessages.timeout : tutorError.message,
          })
        }
      } finally {
        try {
          controller.close()
        } catch {
          // Ya estaba cerrado.
        }
      }
    },
    cancel() {
      stopped.abort()
    },
  })

  return new Response(body, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  })
}
