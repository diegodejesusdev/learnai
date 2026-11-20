import { useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { fetchMessages, streamTutor, TutorRequestError, type TutorTarget } from './tutorApi'
import { conversationsKey, messagesKey } from './useTutor'

const STOP_SAVE_DELAY_MS = 800

/** El turno en curso: lo que escribiste y lo que el tutor lleva escrito. */
export interface PendingTurn {
  userText: string
  answer: string
}

interface ChatOptions {
  target: TutorTarget
  /** null = conversación nueva. */
  conversationId: string | null
  /** La función creó la conversación: la página la selecciona (en la URL). */
  onConversationCreated: (id: string) => void
}

/**
 * Enviar un mensaje y mostrar la respuesta mientras llega. Al terminar se recargan los
 * mensajes guardados (la función es la que guarda) y desaparece el turno provisional.
 */
export function useTutorChat({ target, conversationId, onConversationCreated }: ChatOptions) {
  const queryClient = useQueryClient()
  const [pending, setPending] = useState<PendingTurn | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [remaining, setRemaining] = useState<number | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  /** Devuelve false si falló: el texto vuelve a la caja para reintentar. */
  async function send(message: string): Promise<boolean> {
    const controller = new AbortController()
    abortRef.current = controller
    setError(null)
    setPending({ userText: message, answer: '' })
    let savedId = conversationId
    let failure: string | null = null

    try {
      await streamTutor({ ...target, conversationId, message }, controller.signal, (event) => {
        if (event.type === 'start') savedId = event.conversationId
        else if (event.type === 'delta') {
          setPending((turn) => turn && { ...turn, answer: turn.answer + event.text })
        } else if (event.type === 'done') setRemaining(event.remaining)
        else failure = event.message
      })
    } catch (caught) {
      if (!controller.signal.aborted) {
        failure =
          caught instanceof TutorRequestError
            ? caught.message
            : 'Se cortó la conexión con el tutor. Inténtalo de nuevo.'
      }
    } finally {
      abortRef.current = null
    }

    if (failure !== null) {
      setPending(null)
      setError(failure)
      return false
    }
    // Lo guardado (también si lo detuviste: la función guarda lo que alcanzó a escribir).
    if (controller.signal.aborted) {
      // Lo detuviste: la función guarda lo escrito al notar el corte; se le da un momento.
      await new Promise((resolve) => setTimeout(resolve, STOP_SAVE_DELAY_MS))
    }
    if (savedId) {
      const id = savedId
      const saved = await queryClient
        .fetchQuery({ queryKey: messagesKey(id), queryFn: () => fetchMessages(id) })
        .catch(() => [])
      void queryClient.invalidateQueries({ queryKey: conversationsKey(target) })
      if (controller.signal.aborted) {
        // Por si el guardado tardó más: se vuelve a mirar un poco después.
        setTimeout(() => void queryClient.invalidateQueries({ queryKey: messagesKey(id) }), 2000)
      }
      // Si se detuvo antes de escribir algo, la función borró la conversación nueva.
      if (id !== conversationId && saved.length > 0) onConversationCreated(id)
    }
    setPending(null)
    return true
  }

  return {
    send,
    stop: () => abortRef.current?.abort(),
    pending,
    sending: pending !== null,
    error,
    clearError: () => setError(null),
    remaining,
  }
}
