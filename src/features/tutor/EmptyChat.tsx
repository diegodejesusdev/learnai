import { CalendarClock, ClipboardCheck, GraduationCap, Lightbulb } from 'lucide-react'
import type { TutorMode } from '@shared/tutorTypes'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'

interface EmptyChatProps {
  mode: TutorMode
  subject: string
  onSend: (text: string) => Promise<boolean>
}

/** Conversación vacía: qué hace este modo y, en Explicar, preguntas para empezar. */
export function EmptyChat({ mode, subject, onSend }: EmptyChatProps) {
  if (mode === 'explain') {
    const starters = [
      `Explícame «${subject}» paso a paso`,
      'Dame un ejemplo con una tienda de barrio',
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
        description="Pega tu código, el JSON del flujo (n8n, Make) o el README. El tutor no abre enlaces."
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
