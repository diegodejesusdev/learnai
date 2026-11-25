import { Hourglass, PenLine, Play, Timer } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Button } from '@/components/ui/Button'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { Hero } from '@/components/ui/Hero'
import { SegmentedControl, type SegmentedOption } from '@/components/ui/SegmentedControl'
import { Spinner } from '@/components/ui/Spinner'
import { topicStatuses } from '@/features/ruta/progressModel'
import type { RoadmapData } from '@/features/ruta/RoadmapGate'
import { nextTopic } from '@/lib/progress'
import { activeFirst } from '@/lib/roadmap'
import { NotificationToggle } from './NotificationToggle'
import { studyTargets, type StudyTarget } from './studyTargets'
import { TargetSearch } from './TargetSearch'
import type { TimerMode } from './timerModel'
import { useStartSession } from './useStartSession'

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
  const { start, isPending, settings } = useStartSession()
  const selected = targets.find((target) => target.key === selectedKey)

  const manualQuery = selected?.ref.topicId
    ? `?tema=${selected.ref.topicId}`
    : `?proyecto=${selected?.ref.projectPhaseId ?? ''}`

  return (
    <div className="grid gap-10 xl:grid-cols-2 xl:gap-12">
      <Hero className="flex flex-col justify-between gap-10 xl:sticky xl:top-8 xl:min-h-[28rem] xl:self-start">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-hero-muted">
            {selected?.context ?? 'Elige qué vas a estudiar'}
          </p>
          <p className="text-lead text-balance wrap-break-word hyphens-auto">
            {selected?.title ?? '—'}
          </p>
        </div>
        <Button
          variant="inverse"
          size="xl"
          onClick={() => selected && start(mode, selected.ref)}
          disabled={!selected || isPending}
        >
          {isPending ? <Spinner /> : <Play className="size-6 fill-current" />}
          Iniciar
        </Button>
      </Hero>
      <div className="flex flex-col gap-8">
        <TargetSearch targets={targets} selected={selected} onSelect={setSelectedKey} />
        <div className="flex flex-col gap-3">
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
                  className="font-semibold text-fg underline decoration-control underline-offset-4 hover:decoration-fg"
                >
                  Ajustes
                </Link>
                .
              </>
            ) : (
              'Cronómetro hacia arriba: se detiene cuando tú quieras.'
            )}
          </p>
          {mode === 'pomodoro' && <NotificationToggle />}
        </div>
        <ButtonLink to={`/estudiar/manual${manualQuery}`} variant="secondary" size="lg">
          <PenLine className="size-5" />
          Registrar sesión manual
        </ButtonLink>
      </div>
    </div>
  )
}
