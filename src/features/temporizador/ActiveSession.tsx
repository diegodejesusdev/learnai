import { useState } from 'react'
import { useProgress } from '@/features/ruta/useProgress'
import { useRoadmap } from '@/features/ruta/useRoadmap'
import { phaseLabel } from '@/lib/roadmap'
import { FinishSessionForm } from './FinishSessionForm'
import { RunningSession } from './RunningSession'
import { targetTitle } from './studyTargets'
import { pause, type ActiveTimer } from './timerModel'
import { useTimerChange } from './useActiveTimer'

/** Sesión en curso: el temporizador o, al tocar «Terminar», el formulario para guardarla. */
export function ActiveSession({ timer }: { timer: ActiveTimer }) {
  const [finishing, setFinishing] = useState(false)
  const change = useTimerChange()
  const phases = useRoadmap().data?.phases ?? []
  const progress = useProgress().data

  const title = targetTitle(phases, timer) ?? 'Sesión de estudio'
  const phase = phases.find(
    (candidate) =>
      candidate.id === timer.projectPhaseId ||
      candidate.topics.some((topic) => topic.id === timer.topicId),
  )
  const context = phase
    ? timer.projectPhaseId
      ? `Proyecto · ${phaseLabel(phase)}`
      : `${phaseLabel(phase)} · ${phase.title}`
    : ''
  const status = timer.topicId
    ? progress?.topics[timer.topicId]?.status
    : progress?.projects[timer.projectPhaseId ?? '']?.status

  if (finishing) {
    return (
      <FinishSessionForm
        timer={timer}
        title={title}
        alreadyDone={status === 'hecho'}
        onBack={() => setFinishing(false)}
      />
    )
  }

  return (
    <RunningSession
      timer={timer}
      title={title}
      context={context}
      onFinish={() => {
        // Al terminar se pausa: el tiempo deja de correr mientras escribes las notas,
        // también si recargas o miras desde otro dispositivo.
        if (timer.pausedAt === null)
          change.mutate({ kind: 'update', timer: pause(timer, new Date()) })
        setFinishing(true)
      }}
    />
  )
}
