import { CircleCheck } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router'
import { ButtonLink } from '@/components/ui/ButtonLink'
import type { LessonSection } from '@/lib/lessonSections'
import type { LessonProgress } from './lessonApi'
import { LessonSectionView } from './LessonSectionView'
import { useReadingProgress } from './useReadingProgress'
import { useSaveLessonProgress } from './useLessonProgress'

interface LessonBodyProps {
  topicId: string
  sections: readonly LessonSection[]
  progress: LessonProgress
}

/** El texto de la lección. Al llegar al final queda marcada como leída. */
export function LessonBody({ topicId, sections, progress }: LessonBodyProps) {
  const lessonRef = useRef<HTMLElement>(null)
  const save = useSaveLessonProgress()
  useReadingProgress(lessonRef, progress, (next) => save.mutate({ topicId, ...next }))

  // Al recargar con una sección en la URL: el texto llega después de que React Router la buscó.
  const initialHash = useRef(useLocation().hash)
  useEffect(() => {
    const id = initialHash.current.slice(1)
    if (id !== '') document.getElementById(id)?.scrollIntoView()
  }, [])

  return (
    <div className="flex min-w-0 flex-col gap-10">
      <article ref={lessonRef} className="flex flex-col gap-10">
        {sections.map((section) => (
          <LessonSectionView key={section.id} section={section} />
        ))}
      </article>
      <footer className="flex flex-col items-start gap-4 border-t-2 border-fg pt-5">
        <p role="status" className="flex items-center gap-2 font-semibold">
          {progress.readAt === null ? (
            <span className="font-normal text-fg-muted">
              Al llegar al final queda marcada como leída.
            </span>
          ) : (
            <>
              <CircleCheck className="size-5 shrink-0" />
              Lección leída
            </>
          )}
        </p>
        <ButtonLink to={`/ruta/tema/${topicId}`} variant="secondary">
          Volver al tema
        </ButtonLink>
      </footer>
    </div>
  )
}
