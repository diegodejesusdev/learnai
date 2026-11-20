import { CircleCheck, CircleX } from 'lucide-react'
import type { QuizQuestion } from '@shared/quiz'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/cn'

interface QuizQuestionCardProps {
  question: QuizQuestion
  number: number
  total: number
  answer: number | null
  onAnswer: (option: number) => void
}

const LETTERS = ['A', 'B', 'C', 'D']

/** Una pregunta: al elegir se marca la correcta, la elegida y se muestra la explicación. */
export function QuizQuestionCard({
  question,
  number,
  total,
  answer,
  onAnswer,
}: QuizQuestionCardProps) {
  const answered = answer !== null
  const correct = answer === question.correctIndex
  return (
    <Card className="flex flex-col gap-3">
      <p className="text-xs font-medium text-fg-muted">
        Pregunta {number} de {total}
      </p>
      <p className="font-medium">{question.question}</p>
      <ul className="flex flex-col gap-2">
        {question.options.map((option, index) => {
          const isCorrect = answered && index === question.correctIndex
          const isWrongChoice = answered && index === answer && !correct
          return (
            <li key={index}>
              <button
                type="button"
                disabled={answered}
                aria-pressed={answer === index}
                onClick={() => onAnswer(index)}
                className={cn(
                  'flex min-h-11 w-full items-start gap-3 rounded-xl border border-border px-3 py-2.5 text-left text-sm transition-colors',
                  !answered && 'hover:border-accent hover:bg-surface-muted',
                  isCorrect && 'border-done bg-done-soft text-done',
                  isWrongChoice && 'border-danger bg-danger/10 text-danger',
                  answered && !isCorrect && !isWrongChoice && 'opacity-60',
                )}
              >
                <span className="font-semibold">{LETTERS[index]}.</span>{' '}
                <span className="flex-1">{option}</span>
                {isCorrect && <CircleCheck className="size-5 shrink-0" aria-label="Correcta" />}
                {isWrongChoice && <CircleX className="size-5 shrink-0" aria-label="Tu respuesta" />}
              </button>
            </li>
          )
        })}
      </ul>
      {answered && (
        <p role="status" className="text-sm">
          <span className={cn('font-semibold', correct ? 'text-done' : 'text-danger')}>
            {correct ? '¡Correcto! ' : `Era la ${LETTERS[question.correctIndex] ?? ''}. `}
          </span>
          <span className="text-fg-muted">{question.explanation}</span>
        </p>
      )}
    </Card>
  )
}
