import { Hourglass, PenLine, Play, Timer } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Button } from '@/components/ui/Button'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { SegmentedControl, type SegmentedOption } from '@/components/ui/SegmentedControl'
import { Spinner } from '@/components/ui/Spinner'
import { defaultSettings } from '@/features/ajustes/settingsApi'
import { useUserSettings } from '@/features/ajustes/useUserSettings'
import { topicStatuses } from '@/features/ruta/progressModel'
import type { RoadmapData } from '@/features/ruta/RoadmapGate'
import { unlockAudio } from '@/lib/alerts'
import { nextTopic } from '@/lib/progress'
import { activeFirst } from '@/lib/roadmap'
import { NotificationToggle } from './NotificationToggle'
import { studyTargets, type StudyTarget } from './studyTargets'
import { TargetPicker } from './TargetPicker'
import { createTimer, type TimerMode } from './timerModel'
import { useTimerChange } from './useActiveTimer'

const modeOptions: readonly SegmentedOption<TimerMode>[] = [
  { value: 'pomodoro', label: 'Pomodoro', icon: Timer },
  { value: 'free', label: 'Libre', icon: Hourglass },
]

/** Tema por defecto: el de la URL (?tema= o ?proyecto=), si no, el siguiente de la ruta activa. */
function defaultTargetKey(
  params: URLSearchParams,
  targets: readonly StudyTarget[],
  fallback?: string,
) {
  const fromUrl = params.get('tema')
    ? `tema:${params.get('tema')}`
    : `proyecto:${params.get('proyecto')}`
  if (targets.some((target) => target.key === fromUrl)) return fromUrl
  return fallback ?? targets[0]?.key ?? ''
}

export function StudySetup({ roadmap, progress, activeTrack }: RoadmapData) {
  const [params] = useSearchParams()
  const targets = studyTargets(activeFirst(roadmap.tracks, activeTrack.id))
  const suggestion = nextTopic(activeTrack.phases, topicStatuses(progress))
  const [selectedKey, setSelectedKey] = useState(() =>
    defaultTargetKey(params, targets, suggestion && `tema:${suggestion.topic.id}`),
  )
  const [mode, setMode] = useState<TimerMode>('pomodoro')
  const settings = useUserSettings().data ?? defaultSettings
  const change = useTimerChange()
  const selected = targets.find((target) => target.key === selectedKey)

  function start() {
    if (!selected) return
    unlockAudio() // el toque en «Iniciar» permite que luego suene el aviso
    change.mutate({
      kind: 'start',
      timer: createTimer({
        mode,
        target: selected.ref,
        workMin: settings.pomodoro_work_min,
        breakMin: settings.pomodoro_break_min,
        now: new Date(),
      }),
    })
  }

  const manualQuery = selected?.ref.topicId
    ? `?tema=${selected.ref.topicId}`
    : `?proyecto=${selected?.ref.projectPhaseId ?? ''}`

  return (
    <div className="flex flex-col gap-5">
      <TargetPicker targets={targets} selected={selected} onSelect={setSelectedKey} />
      <div className="flex flex-col gap-2">
        <SegmentedControl
          label="Modo del temporizador"
          options={modeOptions}
          value={mode}
          onChange={setMode}
        />
        <p className="text-sm text-fg-muted">
          {mode === 'pomodoro' ? (
            <>
              {settings.pomodoro_work_min} min de trabajo y {settings.pomodoro_break_min} de
              descanso, en ciclos. Cámbialo en{' '}
              <Link
                to="/ajustes"
                className="font-medium text-accent underline-offset-2 hover:underline"
              >
                Ajustes
              </Link>
              .
            </>
          ) : (
            'Cronómetro hacia arriba: se detiene cuando tú quieras.'
          )}
        </p>
      </div>
      <Button size="lg" onClick={start} disabled={!selected || change.isPending}>
        {change.isPending ? <Spinner /> : <Play className="size-5" />}
        Iniciar
      </Button>
      {mode === 'pomodoro' && <NotificationToggle />}
      <ButtonLink to={`/estudiar/manual${manualQuery}`} variant="secondary">
        <PenLine className="size-4" />
        Registrar sesión manual
      </ButtonLink>
    </div>
  )
}
