import { useEffect, useRef, type ReactNode } from 'react'
import { Spinner } from '@/components/ui/Spinner'
import { AssistantBubble, ChatEntry, UserBubble } from './ChatEntry'
import { LazyMarkdown } from './LazyMarkdown'
import type { NotesTarget } from './SaveToNotes'
import type { TutorMessage } from './tutorApi'
import type { PendingTurn } from './useTutorChat'
import { useQuizResults } from './useTutor'

interface ChatThreadProps {
  messages: readonly TutorMessage[]
  pending: PendingTurn | null
  /** Tema del quiz (solo en el modo Quiz): sus respuestas se muestran como tarjetas. */
  quizTopicId: string | null
  notesTarget: NotesTarget | null
  empty: ReactNode
}

function nearBottom(): boolean {
  return window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 240
}

export function ChatThread({
  messages,
  pending,
  quizTopicId,
  notesTarget,
  empty,
}: ChatThreadProps) {
  const endRef = useRef<HTMLDivElement>(null)
  const quizIds = quizTopicId ? messages.filter((m) => m.role === 'assistant').map((m) => m.id) : []
  const results = useQuizResults(quizIds)

  // Al enviar, y mientras llega la respuesta si estás leyendo al final, se baja hasta el final.
  const sendingText = pending?.userText
  useEffect(() => {
    if (sendingText) endRef.current?.scrollIntoView({ block: 'end' })
  }, [sendingText])
  const answerLength = pending?.answer.length ?? 0
  useEffect(() => {
    if (answerLength > 0 && nearBottom()) endRef.current?.scrollIntoView({ block: 'end' })
  }, [answerLength])

  if (messages.length === 0 && !pending) return <>{empty}</>

  return (
    <div className="flex flex-col gap-8" aria-live="polite" aria-busy={pending !== null}>
      {messages.map((message) => (
        <ChatEntry
          key={message.id}
          message={message}
          quizTopicId={quizTopicId}
          quizResult={results.data?.find((result) => result.messageId === message.id)}
          notesTarget={notesTarget}
        />
      ))}
      {pending && (
        <>
          <UserBubble>{pending.userText}</UserBubble>
          <AssistantBubble>
            {pending.answer === '' || quizTopicId ? (
              <p className="flex items-center gap-2 py-2 text-sm text-fg-muted">
                <Spinner className="text-meter" />
                {quizTopicId ? 'Preparando 5 preguntas…' : 'Pensando…'}
              </p>
            ) : (
              <LazyMarkdown text={pending.answer} />
            )}
          </AssistantBubble>
        </>
      )}
      {/* El margen deja el final de la respuesta por encima de la caja de texto. */}
      <div ref={endRef} className="scroll-mb-20 lg:scroll-mb-28" />
    </div>
  )
}
