import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { SaveIndicator } from '@/components/ui/SaveIndicator'
import { Section } from '@/components/ui/Section'
import { TextField } from '@/components/ui/TextField'
import { saveStatus } from '@/lib/saveStatus'
import { useDebouncedSave } from '@/lib/useDebouncedSave'
import { defaultSettings, type UserSettings } from './settingsApi'
import { useSaveUserSettings, useUserSettings } from './useUserSettings'

type Patch = Partial<UserSettings>

function intInRange(value: string, min: number, max: number): number | null {
  const number = Number(value)
  return Number.isInteger(number) && number >= min && number <= max ? number : null
}

interface StudySettingsFormProps {
  settings: UserSettings
  /** Mientras llegan los ajustes de la cuenta: el formulario ocupa su lugar, deshabilitado. */
  disabled: boolean
}

function StudySettingsForm({ settings, disabled }: StudySettingsFormProps) {
  const save = useSaveUserSettings()
  const autosave = useDebouncedSave((patch: Patch) => save.mutate(patch))
  const [form, setForm] = useState({
    goalHours: String(Math.round(settings.weekly_goal_minutes / 60)),
    work: String(settings.pomodoro_work_min),
    rest: String(settings.pomodoro_break_min),
    streakMin: String(settings.streak_min_minutes),
  })
  const goal = intInRange(form.goalHours, 1, 100)
  const work = intInRange(form.work, 1, 180)
  const rest = intInRange(form.rest, 1, 60)
  const streakMin = intInRange(form.streakMin, 1, 240)

  function update(field: keyof typeof form, value: string) {
    const next = { ...form, [field]: value }
    setForm(next)
    const nextGoal = intInRange(next.goalHours, 1, 100)
    const nextWork = intInRange(next.work, 1, 180)
    const nextRest = intInRange(next.rest, 1, 60)
    const nextStreakMin = intInRange(next.streakMin, 1, 240)
    if (nextGoal === null || nextWork === null || nextRest === null || nextStreakMin === null) {
      return
    }
    autosave.schedule({
      weekly_goal_minutes: nextGoal * 60,
      pomodoro_work_min: nextWork,
      pomodoro_break_min: nextRest,
      streak_min_minutes: nextStreakMin,
    })
  }

  return (
    <Card className="flex flex-col gap-4">
      <fieldset
        disabled={disabled}
        aria-busy={disabled}
        className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2"
      >
        <TextField
          label="Meta semanal (horas)"
          type="number"
          inputMode="numeric"
          min={1}
          max={100}
          value={form.goalHours}
          onChange={(event) => update('goalHours', event.target.value)}
          error={goal === null ? 'Entre 1 y 100 horas.' : null}
        />
        <TextField
          label="Mínimo diario para la racha (min)"
          type="number"
          inputMode="numeric"
          min={1}
          max={240}
          value={form.streakMin}
          onChange={(event) => update('streakMin', event.target.value)}
          hint="Un día cuenta en la racha si estudias al menos esto."
          error={streakMin === null ? 'Entre 1 y 240 minutos.' : null}
        />
        <TextField
          label="Pomodoro: trabajo (min)"
          type="number"
          inputMode="numeric"
          min={1}
          max={180}
          value={form.work}
          onChange={(event) => update('work', event.target.value)}
          error={work === null ? 'Entre 1 y 180 minutos.' : null}
        />
        <TextField
          label="Pomodoro: descanso (min)"
          type="number"
          inputMode="numeric"
          min={1}
          max={60}
          value={form.rest}
          onChange={(event) => update('rest', event.target.value)}
          error={rest === null ? 'Entre 1 y 60 minutos.' : null}
        />
      </fieldset>
      <p className="text-xs text-fg-muted">
        Los minutos del Pomodoro aplican a las sesiones nuevas; la que está en curso conserva los
        suyos.
      </p>
      <SaveIndicator
        status={saveStatus({ isWaiting: autosave.isWaiting, ...save })}
        onRetry={() => save.variables && save.mutate(save.variables)}
      />
    </Card>
  )
}

export function StudySettingsSection() {
  const settings = useUserSettings()
  return (
    <Section
      title="Estudio"
      description="Se guardan en tu cuenta y valen en todos tus dispositivos."
    >
      {/* Mismo formulario mientras carga (deshabilitado): así lo de abajo no se mueve. */}
      <StudySettingsForm
        key={settings.data ? 'cuenta' : 'cargando'}
        settings={settings.data ?? defaultSettings}
        disabled={!settings.data}
      />
    </Section>
  )
}
