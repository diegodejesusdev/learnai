import { CircleCheck, Clock } from 'lucide-react'
import { formatDayKey, formatShortDate } from '@/lib/dates'
import type { Lesson, LessonProgress } from './lessonApi'

/** Cuánto toma, de cuándo es y si ya la leíste. */
export function LessonMeta({ lesson, progress }: { lesson: Lesson; progress: LessonProgress }) {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-fg-muted xl:flex-col">
      <p className="flex items-center gap-1.5">
        <Clock className="size-4 shrink-0" />
        <span>Tiempo estimado: {lesson.minutes} min</span>
      </p>
      {progress.readAt && (
        <p className="flex items-center gap-1.5 font-semibold text-fg">
          <CircleCheck className="size-4 shrink-0" />
          <span>Leída el {formatShortDate(progress.readAt)}</span>
        </p>
      )}
      <p>Actualizada el {formatDayKey(lesson.updated, 'd MMM yyyy')}</p>
    </div>
  )
}
