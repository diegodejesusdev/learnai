import { onlineManager, useMutation, useQueryClient } from '@tanstack/react-query'
import { Check } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { TextAreaField } from '@/components/ui/TextAreaField'
import { TextField } from '@/components/ui/TextField'
import { topicStatuses } from '@/features/ruta/progressModel'
import type { RoadmapData } from '@/features/ruta/RoadmapGate'
import { progressKey } from '@/features/ruta/useProgress'
import { formatDuration, toDateInputValue, toTimeInputValue } from '@/lib/dates'
import { nextTopic } from '@/lib/progress'
import { activeFirst } from '@/lib/roadmap'
import { syncScope } from '@/lib/offline'
import { invalidateSessionQueries } from '@/lib/sessionQueries'
import { toast } from '@/lib/toast'
import { newId } from '@/lib/uuid'
import { parseManualSession } from './manualSession'
import { studyTargets } from './studyTargets'
import { TargetPicker } from './TargetPicker'
import { manualSessionKey } from './useActiveTimer'
import { recordManualSession } from './timerApi'

const DEFAULT_MINUTES = 30

export function ManualSessionForm({ roadmap, progress, activeTrack }: RoadmapData) {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const targets = studyTargets(activeFirst(roadmap.tracks, activeTrack.id))
  const suggestion = nextTopic(activeTrack.phases, topicStatuses(progress))
  const [selectedKey, setSelectedKey] = useState(() => {
    const fromUrl = params.get('tema')
      ? `tema:${params.get('tema')}`
      : `proyecto:${params.get('proyecto')}`
    if (targets.some((target) => target.key === fromUrl)) return fromUrl
    return suggestion ? `tema:${suggestion.topic.id}` : (targets[0]?.key ?? '')
  })
  // Por defecto: hoy, empezando hace 30 minutos (hora de Bogotá).
  const [form, setForm] = useState(() => {
    const start = new Date(Date.now() - DEFAULT_MINUTES * 60_000)
    return {
      date: toDateInputValue(start),
      time: toTimeInputValue(start),
      duration: String(DEFAULT_MINUTES),
      notes: '',
    }
  })
  const [markDone, setMarkDone] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const selected = targets.find((target) => target.key === selectedKey)
  const parsed = parseManualSession(
    { date: form.date, time: form.time, durationMinutes: form.duration },
    new Date(),
  )

  const save = useMutation({
    mutationKey: manualSessionKey,
    scope: syncScope,
    mutationFn: recordManualSession,
    onSuccess: (_id, input) => {
      void queryClient.invalidateQueries({ queryKey: progressKey })
      invalidateSessionQueries(queryClient)
      toast.success(
        `Sesión registrada: ${formatDuration(input.durationMinutes)} en «${selected?.title ?? ''}».`,
      )
      void navigate('/estudiar')
    },
  })

  const update = (field: keyof typeof form) => (event: { target: { value: string } }) =>
    setForm({ ...form, [field]: event.target.value })

  return (
    <form
      className="flex max-w-2xl flex-col gap-8"
      onSubmit={(event) => {
        event.preventDefault()
        setSubmitted(true)
        if (!parsed.ok || !selected) return
        const { startedAt, endedAt, durationMinutes } = parsed
        save.mutate({
          id: newId(),
          target: selected.ref,
          startedAt,
          endedAt,
          durationMinutes,
          notes: form.notes.trim(),
          markDone,
        })
        // Sin conexión, la sesión espera en la cola: no tiene sentido quedarse esperando aquí.
        if (!onlineManager.isOnline()) {
          toast.success(
            `Sin conexión: la sesión (${formatDuration(durationMinutes)}) quedó en este dispositivo y se subirá al volver internet.`,
          )
          void navigate('/estudiar')
        }
      }}
    >
      <TargetPicker targets={targets} selected={selected} onSelect={setSelectedKey} />
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Fecha"
            type="date"
            value={form.date}
            onChange={update('date')}
            required
          />
          <TextField
            label="Hora de inicio"
            type="time"
            value={form.time}
            onChange={update('time')}
            required
          />
        </div>
        <p className="-mt-3 text-sm text-fg-muted">Hora de Colombia.</p>
        {submitted && !parsed.ok && parsed.field === 'date' && <Alert>{parsed.error}</Alert>}
        <TextField
          label="Duración (minutos)"
          type="number"
          inputMode="numeric"
          min={1}
          max={720}
          value={form.duration}
          onChange={update('duration')}
          error={!parsed.ok && parsed.field === 'duration' ? parsed.error : null}
        />
        <TextAreaField
          label="¿Qué aprendiste?"
          rows={4}
          value={form.notes}
          onChange={update('notes')}
        />
        <label className="flex min-h-11 cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={markDone}
            onChange={(event) => setMarkDone(event.target.checked)}
            className="size-6 shrink-0 accent-[var(--meter)]"
          />
          <span>Marcar «{selected?.title ?? ''}» como hecho</span>
        </label>
      </div>
      {save.isError && (
        <Alert>No se pudo registrar la sesión. Revisa tu conexión e inténtalo de nuevo.</Alert>
      )}
      <Button type="submit" size="lg" disabled={save.isPending || !selected}>
        {save.isPending ? <Spinner /> : <Check className="size-5" />}
        Guardar sesión
      </Button>
    </form>
  )
}
