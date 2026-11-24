import { useRef, type ReactNode } from 'react'
import { parseQuiz } from '@shared/quiz'
import { Alert } from '@/components/ui/Alert'
import { LazyMarkdown } from './LazyMarkdown'
import { QuizCard } from './QuizCard'
import { SaveToNotes, type NotesTarget } from './SaveToNotes'
import type { QuizResult, TutorMessage } from './tutorApi'

export function UserBubble({ children }: { children: ReactNode }) {
  return (
    <div className="flex justify-end">
      <p className="max-w-[85%] bg-action px-4 py-3 wrap-anywhere whitespace-pre-wrap text-action-fg">
        {children}
      </p>
    </div>
  )
}

export function AssistantBubble({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-2 border-t-2 border-meter pt-4">
      <p className="text-sm font-bold text-accent">Tutor</p>
      {children}
    </div>
  )
}

interface ChatEntryProps {
  message: TutorMessage
  quizTopicId: string | null
  quizResult: QuizResult | undefined
  notesTarget: NotesTarget | null
}

/** Un mensaje guardado: tuyo, una respuesta en Markdown o un quiz interactivo. */
export function ChatEntry({ message, quizTopicId, quizResult, notesTarget }: ChatEntryProps) {
  const bubbleRef = useRef<HTMLDivElement>(null)
  if (message.role === 'user') return <UserBubble>{message.content}</UserBubble>

  if (quizTopicId !== null) {
    const parsed = parseQuiz(message.content)
    return (
      <AssistantBubble>
        {parsed.ok ? (
          <QuizCard
            key={quizResult ? `${message.id}-guardado` : message.id}
            quiz={parsed.quiz}
            messageId={message.id}
            topicId={quizTopicId}
            savedResult={quizResult}
          />
        ) : (
          <Alert>Este quiz no se pudo leer ({parsed.error}). Pide uno nuevo.</Alert>
        )}
      </AssistantBubble>
    )
  }

  return (
    <AssistantBubble>
      <div ref={bubbleRef}>
        <LazyMarkdown text={message.content} />
      </div>
      {notesTarget && (
        <SaveToNotes text={message.content} messageRef={bubbleRef} {...notesTarget} />
      )}
    </AssistantBubble>
  )
}
