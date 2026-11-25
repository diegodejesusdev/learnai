import { defaultSettings } from '@/features/ajustes/settingsApi'
import { useUserSettings } from '@/features/ajustes/useUserSettings'
import { unlockAudio } from '@/lib/alerts'
import { createTimer, type StudyTargetRef, type TimerMode } from './timerModel'
import { useTimerChange } from './useActiveTimer'

/** Empezar una sesión con los minutos de Ajustes. */
export function useStartSession() {
  const settings = useUserSettings().data ?? defaultSettings
  const change = useTimerChange()

  /** Se llama desde un toque: así el navegador permite que luego suene el aviso. */
  function start(mode: TimerMode, target: StudyTargetRef) {
    unlockAudio()
    change.mutate({
      kind: 'start',
      timer: createTimer({
        mode,
        target,
        workMin: settings.pomodoro_work_min,
        breakMin: settings.pomodoro_break_min,
        now: new Date(),
      }),
    })
  }

  return { start, isPending: change.isPending, settings }
}
