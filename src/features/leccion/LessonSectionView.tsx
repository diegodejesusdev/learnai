import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { isAnswers, type LessonSection } from '@/lib/lessonSections'
import { LessonMarkdown } from './LessonMarkdown'

/** Las respuestas, ocultas hasta que las pidas: primero intenta contestar el repaso. */
function HiddenAnswers({ section }: { section: LessonSection }) {
  const [shown, setShown] = useState(false)
  const contentId = `${section.id}-texto`
  const Icon = shown ? EyeOff : Eye
  return (
    <div className="flex flex-col items-start gap-5">
      <Button
        variant="secondary"
        aria-expanded={shown}
        aria-controls={contentId}
        onClick={() => setShown(!shown)}
      >
        <Icon className="size-4" />
        {shown ? 'Ocultar respuestas' : 'Ver respuestas'}
      </Button>
      <div id={contentId} hidden={!shown} className="w-full">
        {shown && <LessonMarkdown text={section.body} subheadings={section.subheadings} />}
      </div>
    </div>
  )
}

/** Una sección de la lección, con su título. */
export function LessonSectionView({ section }: { section: LessonSection }) {
  const content = isAnswers(section) ? (
    <HiddenAnswers section={section} />
  ) : (
    <LessonMarkdown text={section.body} subheadings={section.subheadings} />
  )
  if (section.title === '') return content
  return (
    <section
      aria-labelledby={section.id}
      className="flex flex-col gap-4 border-t border-border pt-8 first:border-t-0 first:pt-0"
    >
      <h2 id={section.id} className="text-title">
        {section.title}
      </h2>
      {content}
    </section>
  )
}
