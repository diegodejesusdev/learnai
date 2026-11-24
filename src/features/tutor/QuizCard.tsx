import { RotateCcw, Trophy } from 'lucide-react'
import { useState } from 'react'
import { quizScore, type Quiz } from '@shared/quiz'
import { Button } from '@/components/ui/Button'
import { Hero } from '@/components/ui/Hero'
import { SaveIndicator } from '@/components/ui/SaveIndicator'
import { saveStatus } from '@/lib/saveStatus'
import { initialAnswers, quizFeedback } from './quizFeedback'
import { QuizQuestionCard } from './QuizQuestionCard'
import type { QuizResult } from './tutorApi'
import { useSaveQuizResult } from './useTutor'

interface QuizCardProps {
  quiz: Quiz
  messageId: string
  topicId: string
  savedResult: QuizResult | undefined
}

/** Quiz interactivo: al responder la última pregunta se muestra el puntaje y se guarda. */
export function QuizCard({ quiz, messageId, topicId, savedResult }: QuizCardProps) {
  const total = quiz.questions.length
  const [answers, setAnswers] = useState(() => initialAnswers(savedResult?.answers, total))
  const save = useSaveQuizResult()
  const finished = answers.every((answer) => answer !== null)
  const score = quizScore(quiz, answers)

  function answer(questionIndex: number, option: number) {
    if (answers[questionIndex] !== null) return
    const next = answers.map((value, index) => (index === questionIndex ? option : value))
    setAnswers(next)
    if (next.every((value) => value !== null)) {
      save.mutate({
        messageId,
        topicId,
        score: quizScore(quiz, next),
        total,
        answers: next.map((value) => value ?? 0),
      })
    }
  }

  return (
    <div className="flex flex-col gap-10">
      {quiz.questions.map((question, index) => (
        <QuizQuestionCard
          key={index}
          question={question}
          number={index + 1}
          total={total}
          answer={answers[index] ?? null}
          onAnswer={(option) => answer(index, option)}
        />
      ))}
      {finished && (
        <Hero className="flex flex-col gap-4 lg:p-8">
          <p className="flex items-center gap-3 text-display">
            <Trophy className="size-10" />
            {score} de {total}
          </p>
          <p className="text-hero-muted">{quizFeedback(score, total)}</p>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <SaveIndicator
              status={save.isIdle ? 'saved' : saveStatus({ isWaiting: false, ...save })}
              onRetry={() => save.variables && save.mutate(save.variables)}
            />
            <Button variant="outline" onClick={() => setAnswers(initialAnswers(undefined, total))}>
              <RotateCcw className="size-4" />
              Repetir este quiz
            </Button>
          </div>
        </Hero>
      )}
    </div>
  )
}
