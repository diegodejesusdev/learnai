import { Bot } from 'lucide-react'
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
      <p className="max-w-[85%] rounded-2xl rounded-br-md bg-accent px-3.5 py-2.5 text-sm whitespace-pre-wrap text-accent-fg">
        {children}
      </p>
    </div>
  )
}

export function AssistantBubble({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-2">
      <span className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-soft-fg">
        <Bot className="size-4" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">{children}</div>
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
      <div
        ref={bubbleRef}
        className="rounded-2xl rounded-tl-md bg-surface px-3.5 py-2.5 ring-1 ring-border"
      >
        <LazyMarkdown text={message.content} />
      </div>
      {notesTarget && (
        <SaveToNotes text={message.content} messageRef={bubbleRef} {...notesTarget} />
      )}
    </AssistantBubble>
  )
}
