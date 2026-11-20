import { useEffect, useRef } from 'react'
import { playChime, showNotification, vibrate } from '@/lib/alerts'
import { toast } from '@/lib/toast'
import { useNow } from '@/lib/useNow'
import { useWakeLock } from '@/lib/useWakeLock'
import { activeSeconds, pomodoroState } from './timerModel'
import { useActiveTimer } from './useActiveTimer'

function announceBlockEnd(newPhase: 'work' | 'break', breakMin: number) {
  const [title, body] =
    newPhase === 'break'
      ? ['¡Bloque de trabajo terminado!', `Descansa ${breakMin} min.`]
      : ['Terminó el descanso', 'A seguir estudiando.']
  playChime()
  vibrate()
  showNotification(title, body)
  toast.success(`${title} ${body}`)
}

/**
 * Sin interfaz: mientras corre el temporizador mantiene la pantalla encendida y avisa al
 * cambiar de bloque Pomodoro, esté donde esté el usuario dentro de la app.
 */
export function ActiveTimerEffects() {
  const { data: timer } = useActiveTimer()
  const running = Boolean(timer && timer.pausedAt === null)
  const now = useNow(running)
  useWakeLock(running)

  const pomodoro =
    timer && running && timer.mode === 'pomodoro'
      ? pomodoroState(activeSeconds(timer, now), timer.workMin, timer.breakMin)
      : null
  const startedAt = timer?.startedAt
  const breakMin = timer?.breakMin ?? 5
  const blockIndex = pomodoro?.blockIndex
  const phase = pomodoro?.phase
  const secondsIntoBlock = pomodoro?.secondsIntoBlock

  const lastBlock = useRef<{ startedAt: string; blockIndex: number } | null>(null)

  useEffect(() => {
    if (
      startedAt === undefined ||
      blockIndex === undefined ||
      phase === undefined ||
      secondsIntoBlock === undefined
    ) {
      return
    }
    const previous = lastBlock.current
    lastBlock.current = { startedAt, blockIndex }
    // Solo si el cambio acaba de pasar: al volver de un bloqueo largo no suena tarde.
    if (
      previous?.startedAt === startedAt &&
      blockIndex > previous.blockIndex &&
      secondsIntoBlock <= 5
    ) {
      announceBlockEnd(phase, breakMin)
    }
  }, [startedAt, blockIndex, phase, secondsIntoBlock, breakMin])

  return null
}
