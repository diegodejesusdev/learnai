// Edge Function «tutor» (docs/SPEC.md §4.4).
// POST con { conversationId, mode, topicId, phaseId, message } y el token del usuario.
// Responde en streaming (NDJSON) con lo que escribe el modelo y guarda la conversación.
import { withSupabase } from '@supabase/server'
import type { Database } from '../../../src/types/database.ts'
import { startOfBogotaDay } from '../_shared/bogota.ts'
import { quizQuestionTexts } from '../_shared/quiz.ts'
import { buildTutorContext, contextTracks, hasLesson } from '../_shared/tutorContext.ts'
import { dailyLimitFrom, dailyLimitMessage, TutorError } from '../_shared/tutorErrors.ts'
import { buildSystemPrompt } from '../_shared/tutorPrompts.ts'
import { parseTutorRequest } from '../_shared/tutorRequest.ts'
import type { TutorRequest } from '../_shared/tutorTypes.ts'
import * as data from './data.ts'
import type { ProviderMessage } from './providerTypes.ts'
import { createProvider } from './providers.ts'
import { streamAnswer } from './respond.ts'

/** Mensajes anteriores que se reenvían al modelo en cada turno. */
const HISTORY_LIMIT = 20

const env = (name: string) => Deno.env.get(name)

function jsonError(status: number, code: string, message: string): Response {
  return Response.json({ code, error: message }, { status })
}

function conversationTitle(request: TutorRequest, topicTitle: string | undefined): string {
  if (request.mode === 'quiz') return `Quiz: ${topicTitle ?? 'tema'}`
  const firstLine = request.message.split('\n')[0]?.trim() ?? ''
  return firstLine.length > 60 ? `${firstLine.slice(0, 57)}…` : firstLine || 'Conversación'
}

/** El historial para el modelo debe empezar con un mensaje del usuario. */
function trimToUserStart(history: ProviderMessage[]): ProviderMessage[] {
  const first = history.findIndex((message) => message.role === 'user')
  return first === -1 ? [] : history.slice(first)
}

export default {
  // auth 'user': sin un token válido de Supabase Auth responde 401 y no llega hasta aquí.
  fetch: withSupabase<Database>({ auth: 'user' }, async (req, ctx) => {
    if (req.method !== 'POST') return jsonError(405, 'method', 'Usa POST.')
    const parsed = parseTutorRequest(await req.json().catch(() => null))
    if (!parsed.ok) return jsonError(400, 'bad_request', parsed.error)
    const request = parsed.request
    const db = ctx.supabase

    try {
      const provider = createProvider(env)
      const limit = dailyLimitFrom(env('TUTOR_DAILY_LIMIT'))
      const used = await data.countUserMessagesSince(db, startOfBogotaDay(new Date()))
      if (used >= limit) return jsonError(429, 'daily_limit', dailyLimitMessage(limit))

      if (request.conversationId) {
        const conversation = await data.findConversation(db, request.conversationId)
        const sameTarget =
          conversation?.mode === request.mode &&
          conversation.topic_id === request.topicId &&
          conversation.phase_id === request.phaseId
        if (!sameTarget) {
          return jsonError(404, 'conversation', 'Esa conversación ya no existe. Empieza una nueva.')
        }
      }

      const now = new Date()
      const context = await data.loadContextData(db, request, now)
      const phases = context.tracks.flatMap((track) => track.phases)
      const topic = phases.flatMap((phase) => phase.topics).find((t) => t.id === request.topicId)
      if (request.topicId && !topic) return jsonError(400, 'bad_request', 'Ese tema no existe.')
      if (request.phaseId && !phases.some((phase) => phase.id === request.phaseId)) {
        return jsonError(400, 'bad_request', 'Ese proyecto no existe.')
      }

      const history = request.conversationId
        ? await data.loadHistory(db, request.conversationId, HISTORY_LIMIT)
        : []
      // En el quiz no se reenvía el historial (son JSON): solo se pide no repetir preguntas.
      const avoidQuestions = history
        .filter((message) => message.role === 'assistant')
        .flatMap((message) => quizQuestionTexts(message.content))
      const system = buildSystemPrompt(
        request.mode,
        contextTracks(context),
        buildTutorContext(context, now),
        { avoidQuestions, hasLesson: hasLesson(context) },
      )
      const messages: ProviderMessage[] = [
        ...(request.mode === 'quiz' ? [] : trimToUserStart(history)),
        { role: 'user', content: request.message },
      ]

      const conversationId =
        request.conversationId ??
        (await data.createConversation(db, request, conversationTitle(request, topic?.title)))
      const userMessageId = await data.insertMessage(db, {
        conversation_id: conversationId,
        role: 'user',
        content: request.message,
      })

      return streamAnswer({
        db,
        provider,
        request,
        conversationId,
        isNewConversation: request.conversationId === null,
        userMessageId,
        system,
        messages,
        remaining: Math.max(0, limit - used - 1),
      })
    } catch (error) {
      if (error instanceof TutorError) {
        return jsonError(error.code === 'config' ? 500 : 502, error.code, error.message)
      }
      console.error('tutor: error inesperado', error instanceof Error ? error.name : 'desconocido')
      return jsonError(500, 'unknown', 'Algo falló en el tutor. Inténtalo de nuevo.')
    }
  }),
}
