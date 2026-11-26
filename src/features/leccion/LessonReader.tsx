import { MessageCircle } from 'lucide-react'
import { lazy, Suspense, useMemo } from 'react'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { LoadingState } from '@/components/ui/LoadingState'
import { parseSections } from '@/lib/lessonSections'
import type { Lesson } from './lessonApi'
import { LessonAssetsContext } from './lessonAssets'
import { LessonIndex } from './LessonIndex'
import { LessonMeta } from './LessonMeta'
import { lessonProgressOf } from './lessonModel'
import { StudyLessonButton } from './StudyLessonButton'
import { useLessonProgress } from './useLessonProgress'

// El Markdown y los colores del código pesan: se descargan aparte, así la página abre antes.
const LessonBody = lazy(() =>
  import('./LessonBody').then((module) => ({ default: module.LessonBody })),
)

/**
 * En el móvil todo va en una columna (los grupos son «contents»). En el PC: el texto, y al lado el
 * índice y las acciones fijos; desde 1408 px, índice a la izquierda y acciones a la derecha.
 */
export function LessonReader({ lesson, assetBase }: { lesson: Lesson; assetBase: string }) {
  const sections = useMemo(() => parseSections(lesson.content), [lesson.content])
  const progress = lessonProgressOf(useLessonProgress().data, lesson.topicId)

  return (
    <LessonAssetsContext value={assetBase}>
      <div className="flex flex-col gap-8 xl:grid xl:grid-cols-[minmax(0,1fr)_18rem] xl:gap-x-12 wide:grid-cols-[13rem_minmax(0,1fr)_16rem] 3xl:grid-cols-[17rem_minmax(0,1fr)_19rem] 3xl:gap-x-20">
        <div className="contents xl:sticky xl:top-[calc(2rem+var(--banner-height,0px))] xl:col-start-2 xl:row-start-1 xl:flex xl:max-h-[calc(100dvh-4rem-var(--banner-height,0px))] xl:flex-col xl:gap-8 xl:self-start xl:overflow-y-auto wide:contents">
          <aside
            aria-label="Estudiar esta lección"
            className="flex flex-col gap-4 wide:sticky wide:top-[calc(2rem+var(--banner-height,0px))] wide:col-start-3 wide:row-start-1 wide:self-start"
          >
            <LessonMeta lesson={lesson} progress={progress} />
            <div className="flex flex-col gap-3">
              <StudyLessonButton topicId={lesson.topicId} />
              <ButtonLink
                to={`/tutor?tema=${lesson.topicId}`}
                variant="secondary"
                className="py-2.5 text-center"
              >
                <MessageCircle className="size-4 shrink-0" />
                {/* En dos líneas parejas, con el ícono al lado. */}
                <span className="max-w-44 text-balance">
                  Preguntarle al tutor sobre esta lección
                </span>
              </ButtonLink>
            </div>
          </aside>
          <div className="wide:sticky wide:top-[calc(2rem+var(--banner-height,0px))] wide:col-start-1 wide:row-start-1 wide:self-start">
            <LessonIndex sections={sections} />
          </div>
        </div>
        <div className="min-w-0 xl:col-start-1 xl:row-start-1 wide:col-start-2">
          <Suspense fallback={<LoadingState label="Cargando la lección…" />}>
            <LessonBody topicId={lesson.topicId} sections={sections} progress={progress} />
          </Suspense>
        </div>
      </div>
    </LessonAssetsContext>
  )
}
