import { PenLine, Play, Timer, Hourglass } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { SegmentedControl, type SegmentedOption } from '@/components/ui/SegmentedControl'
import { findPhase, findTopic } from '@/data/curriculum'
import { demoStats } from '@/data/demo'
import { StudyTargetSelect, type StudyTarget } from './StudyTargetSelect'
import { TimerPreview } from './TimerPreview'

type TimerMode = 'pomodoro' | 'free'

const modeOptions: readonly SegmentedOption<TimerMode>[] = [
  { value: 'pomodoro', label: 'Pomodoro', icon: Timer },
  { value: 'free', label: 'Libre', icon: Hourglass },
]

// Valores por defecto de user_settings (docs/SPEC.md §5.2).
const WORK_MINUTES = 25
const BREAK_MINUTES = 5

function initialTarget(params: URLSearchParams): StudyTarget {
  const topicId = params.get('tema')
  if (findTopic(topicId ?? undefined)) return `tema:${topicId}`
  const phaseId = params.get('proyecto')
  if (findPhase(phaseId ?? undefined)) return `proyecto:${phaseId}`
  return `tema:${demoStats.lastTopicId}`
}

export function StudyPage() {
  const [params] = useSearchParams()
  const [target, setTarget] = useState(() => initialTarget(params))
  const [mode, setMode] = useState<TimerMode>('pomodoro')

  return (
    <>
      <PageHeader
        title="Estudiar"
        description="Elige un tema o un proyecto y empieza una sesión."
      />
      <div className="flex flex-col gap-4">
        <StudyTargetSelect value={target} onChange={setTarget} />
        <SegmentedControl
          label="Modo del temporizador"
          options={modeOptions}
          value={mode}
          onChange={setMode}
        />
        <TimerPreview mode={mode} workMinutes={WORK_MINUTES} breakMinutes={BREAK_MINUTES} />
        <Button size="lg" disabled>
          <Play className="size-5" />
          Iniciar
        </Button>
        <p className="text-center text-sm text-fg-muted">
          El temporizador funcionará en la fase 4. Cambia la duración del Pomodoro en{' '}
          <Link
            to="/ajustes"
            className="font-medium text-accent underline-offset-2 hover:underline"
          >
            Ajustes
          </Link>
          .
        </p>
        <Button variant="secondary" disabled>
          <PenLine className="size-4" />
          Registrar sesión manual
        </Button>
      </div>
    </>
  )
}
