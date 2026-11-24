import { useState } from 'react'
import { useProgress } from '@/features/ruta/useProgress'
import { useRoadmap } from '@/features/ruta/useRoadmap'
import { FinishSessionForm } from './FinishSessionForm'
import { RunningSession } from './RunningSession'
import { studyTargets, targetKeyOf } from './studyTargets'
import { pause, type ActiveTimer } from './timerModel'
import { useTimerChange } from './useActiveTimer'

/** Sesión en curso: el temporizador o, al tocar «Terminar», el formulario para guardarla. */
export function ActiveSession({ timer }: { timer: ActiveTimer }) {
  const [finishing, setFinishing] = useState(false)
  const change = useTimerChange()
  const tracks = useRoadmap().data?.tracks ?? []
  const progress = useProgress().data

  const target = studyTargets(tracks).find((candidate) => candidate.key === targetKeyOf(timer))
  const title = target?.title ?? 'Sesión de estudio'
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
      context={target?.context ?? ''}
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
