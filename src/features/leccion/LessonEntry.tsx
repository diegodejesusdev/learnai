import { BookDashed, BookOpen } from 'lucide-react'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { formatShortDate } from '@/lib/dates'
import type { LessonProgress } from './lessonApi'
import { lessonProgressOf } from './lessonModel'
import type { LessonAvailability } from './useLesson'
import { useLessonProgress } from './useLessonProgress'

function progressText({ readAt, scrollPct }: LessonProgress): string | null {
  if (readAt !== null) return `Leída el ${formatShortDate(readAt)}`
  return scrollPct > 0 ? `Vas en ${scrollPct} %` : null
}

interface LessonEntryProps {
  topicId: string
  lesson: LessonAvailability
}

/** En la página del tema: entrar a la lección, o decir que aún no está. */
export function LessonEntry({ topicId, lesson }: LessonEntryProps) {
  const progress = lessonProgressOf(useLessonProgress().data, topicId)
  if (lesson.status === 'missing') {
    return (
      <p className="flex min-h-11 items-center gap-2 text-sm text-fg-muted">
        <BookDashed className="size-5 shrink-0" />
        Lección en preparación
      </p>
    )
  }
  const details = [
    lesson.status === 'available' ? `${lesson.info.minutes} min` : null,
    progressText(progress),
  ].filter((text) => text !== null)
  return (
    <div className="flex flex-col gap-2">
      <ButtonLink to={`/ruta/tema/${topicId}/leccion`} size="lg">
        <BookOpen className="size-5" />
        Estudiar lección
      </ButtonLink>
      {details.length > 0 && (
        <p className="text-sm text-fg-muted tabular-nums">{details.join(' · ')}</p>
      )}
    </div>
  )
}
