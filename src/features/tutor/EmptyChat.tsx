import { CalendarClock, ClipboardCheck, GraduationCap, Lightbulb } from 'lucide-react'
import { trackProfile } from '@shared/tutorTracks'
import type { TutorMode } from '@shared/tutorTypes'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Track } from '@/lib/roadmap'

interface EmptyChatProps {
  mode: TutorMode
  subject: string
  /** La ruta del tema o del proyecto. */
  track: Track
  onSend: (text: string) => Promise<boolean>
}

/** Conversación vacía: qué hace este modo y, en Explicar, preguntas para empezar. */
export function EmptyChat({ mode, subject, track, onSend }: EmptyChatProps) {
  const { ui } = trackProfile(track)
  if (mode === 'explain') {
    const starters = [
      `Explícame «${subject}» paso a paso`,
      ui.starter,
      '¿Qué errores comunes se cometen con esto?',
    ]
    return (
      <EmptyState
        icon={Lightbulb}
        title={`Pregúntale al tutor sobre «${subject}»`}
        description="Conoce tus notas, el estado del tema y tus últimas sesiones."
        action={
          <div className="flex flex-col gap-2">
            {starters.map((starter) => (
              <Button key={starter} variant="secondary" onClick={() => void onSend(starter)}>
                {starter}
              </Button>
            ))}
          </div>
        }
      />
    )
  }
  if (mode === 'quiz') {
    return (
      <EmptyState
        icon={GraduationCap}
        title={`Pon a prueba lo que sabes de «${subject}»`}
        description="5 preguntas de opción múltiple. Al terminar ves tu puntaje y queda guardado."
      />
    )
  }
  if (mode === 'project_review') {
    return (
      <EmptyState
        icon={ClipboardCheck}
        title={`Revisemos «${subject}»`}
        description={`${ui.paste} El tutor no abre enlaces.`}
      />
    )
  }
  return (
    <EmptyState
      icon={CalendarClock}
      title="¿Qué estudio hoy?"
      description="Dile cuánto tiempo tienes y te propone un plan según tu progreso."
    />
  )
}
