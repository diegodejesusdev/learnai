import { createEventDecoder } from '@shared/tutorStream'
import type { TutorMode, TutorRequest, TutorStreamEvent } from '@shared/tutorTypes'
import { supabase, supabaseEnv } from '@/lib/supabase'

/** A qué va ligada una conversación: el modo y su tema o proyecto. */
export interface TutorTarget {
  mode: TutorMode
  topicId: string | null
  phaseId: string | null
}

export interface TutorConversation {
  id: string
  title: string
  updatedAt: string
}

export interface TutorMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

export interface QuizResult {
  messageId: string
  score: number
  total: number
  answers: number[]
}

/** Error que la app muestra tal cual (ya viene en español). */
export class TutorRequestError extends Error {
  readonly code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
  }
}

export async function fetchConversations(target: TutorTarget): Promise<TutorConversation[]> {
  let query = supabase
    .from('tutor_conversations')
    .select('id, title, updated_at')
    .eq('mode', target.mode)
    .order('updated_at', { ascending: false })
    .limit(30)
  query = target.topicId ? query.eq('topic_id', target.topicId) : query.is('topic_id', null)
  query = target.phaseId ? query.eq('phase_id', target.phaseId) : query.is('phase_id', null)
  const { data, error } = await query
  if (error) throw error
  return data.map((row) => ({ id: row.id, title: row.title, updatedAt: row.updated_at }))
}

export async function fetchMessages(conversationId: string): Promise<TutorMessage[]> {
  const { data, error } = await supabase
    .from('tutor_messages')
    .select('id, role, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at')
  if (error) throw error
  return data.map((row) => ({
    id: row.id,
    role: row.role,
    content: row.content,
    createdAt: row.created_at,
  }))
}

export async function fetchQuizResults(messageIds: readonly string[]): Promise<QuizResult[]> {
  if (messageIds.length === 0) return []
  const { data, error } = await supabase
    .from('quiz_results')
    .select('message_id, score, total, answers')
    .in('message_id', messageIds)
  if (error) throw error
  return data.map((row) => ({
    messageId: row.message_id,
    score: row.score,
    total: row.total,
    answers: row.answers,
  }))
}

/** Guarda (o reemplaza, si repites el quiz) el resultado de un quiz. */
export async function saveQuizResult(result: QuizResult & { topicId: string }): Promise<void> {
  const { error } = await supabase.from('quiz_results').upsert(
    {
      message_id: result.messageId,
      topic_id: result.topicId,
      score: result.score,
      total: result.total,
      answers: result.answers,
    },
    { onConflict: 'message_id' },
  )
  if (error) throw error
}

/** Agrega un texto al final de las notas del tema o del proyecto (función SQL atómica). */
export async function appendNotes(
  target: { topicId: string } | { phaseId: string },
  text: string,
): Promise<void> {
  const { error } =
    'topicId' in target
      ? await supabase.rpc('append_topic_notes', { p_topic_id: target.topicId, p_text: text })
      : await supabase.rpc('append_project_notes', { p_phase_id: target.phaseId, p_text: text })
  if (error) throw error
}

const httpErrors: Partial<Record<number, string>> = {
  401: 'Tu sesión expiró. Cierra sesión y vuelve a entrar.',
  404: 'El tutor no está disponible: falta desplegar la función «tutor» en Supabase.',
}

/**
 * Envía un mensaje a la Edge Function y entrega los eventos a medida que llegan.
 * Los errores antes del streaming (límite diario, validación, sesión) lanzan TutorRequestError.
 */
export async function streamTutor(
  request: TutorRequest,
  signal: AbortSignal,
  onEvent: (event: TutorStreamEvent) => void,
): Promise<void> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new TutorRequestError('auth', httpErrors[401] ?? '')

  let response: Response
  try {
    response = await fetch(`${supabaseEnv.url}/functions/v1/tutor`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: supabaseEnv.anonKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal,
    })
  } catch (error) {
    if (signal.aborted) throw error
    throw new TutorRequestError('network', 'Sin conexión con el tutor. Revisa tu internet.')
  }

  if (!response.ok || !response.body) {
    const body = (await response.json().catch(() => null)) as {
      code?: string
      error?: string
    } | null
    // Si la función no está desplegada, el 404 lo da la plataforma y no trae nuestro mensaje.
    const fallback =
      httpErrors[response.status] ?? 'El tutor no pudo responder. Inténtalo de nuevo.'
    throw new TutorRequestError(body?.code ?? String(response.status), body?.error ?? fallback)
  }

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
  const decoder = createEventDecoder()
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    decoder.push(value).forEach(onEvent)
  }
  decoder.flush().forEach(onEvent)
}
