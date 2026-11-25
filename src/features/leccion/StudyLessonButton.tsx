import { Play, Timer } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { useActiveTimer } from '@/features/temporizador/useActiveTimer'
import { useStartSession } from '@/features/temporizador/useStartSession'

/** Empieza un Pomodoro de este tema sin salir de la lección. Si ya hay una sesión, lleva a ella. */
export function StudyLessonButton({ topicId }: { topicId: string }) {
  const { data: timer } = useActiveTimer()
  const session = useStartSession()
  if (timer) {
    return (
      <ButtonLink to="/estudiar" variant="secondary">
        <Timer className="size-4 shrink-0" />
        {timer.topicId === topicId ? 'Ver la sesión en curso' : 'Ya tienes otra sesión en curso'}
      </ButtonLink>
    )
  }
  return (
    <Button
      disabled={session.isPending}
      onClick={() => session.start('pomodoro', { topicId, projectPhaseId: null })}
    >
      <Play className="size-4 shrink-0 fill-current" />
      Estudiar con temporizador
    </Button>
  )
}
