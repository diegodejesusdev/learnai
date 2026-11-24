import { Check } from 'lucide-react'
import { useState } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { TextAreaField } from '@/components/ui/TextAreaField'
import { TextField } from '@/components/ui/TextField'
import { studyTargets, targetKeyOf } from '@/features/temporizador/studyTargets'
import { TargetPicker } from '@/features/temporizador/TargetPicker'
import { toDateInputValue, toTimeInputValue } from '@/lib/dates'
import { studyModeLabels } from '@/lib/labels'
import { toast } from '@/lib/toast'
import type { Track } from '@/lib/roadmap'
import { DeleteSessionPanel } from './DeleteSessionPanel'
import { parseSessionEdit } from './sessionEdit'
import { SessionGoneError, type StudySession } from './sessionsApi'
import { useUpdateSession } from './useSessions'

interface SessionEditFormProps {
  session: StudySession
  tracks: readonly Track[]
  /** Al guardar o eliminar: vuelve al Historial. */
  onDone: () => void
}

export function SessionEditForm({ session, tracks, onDone }: SessionEditFormProps) {
  const targets = studyTargets(tracks)
  const [selectedKey, setSelectedKey] = useState(() => targetKeyOf(session.target))
  const [form, setForm] = useState({
    date: toDateInputValue(session.startedAt),
    time: toTimeInputValue(session.startedAt),
    duration: String(session.durationMinutes),
    notes: session.notes,
  })
  const [submitted, setSubmitted] = useState(false)
  const save = useUpdateSession(session.id)
  const selected = targets.find((target) => target.key === selectedKey)
  const parsed = parseSessionEdit(
    { date: form.date, time: form.time, durationMinutes: form.duration },
    session,
    new Date(),
  )

  const update = (field: keyof typeof form) => (event: { target: { value: string } }) =>
    setForm({ ...form, [field]: event.target.value })

  return (
    <div className="flex max-w-2xl flex-col gap-10">
      <form
        className="flex flex-col gap-8"
        onSubmit={(event) => {
          event.preventDefault()
          setSubmitted(true)
          if (!parsed.ok || !selected) return
          const { startedAt, endedAt, durationMinutes } = parsed
          save.mutate(
            { target: selected.ref, startedAt, endedAt, durationMinutes, notes: form.notes.trim() },
            {
              onSuccess: () => {
                toast.success('Sesión actualizada.')
                onDone()
              },
            },
          )
        }}
      >
        <TargetPicker targets={targets} selected={selected} onSelect={setSelectedKey} />
        <div className="flex flex-col gap-5">
          <p className="text-sm text-fg-muted">
            Registrada en modo {studyModeLabels[session.mode]}.
          </p>
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
          <p className="-mt-3 text-sm text-fg-muted">
            Hora de Colombia. La sesión cuenta en el día en que empezó.
          </p>
          {submitted && !parsed.ok && parsed.field === 'date' && <Alert>{parsed.error}</Alert>}
          <TextField
            label="Minutos de estudio"
            type="number"
            inputMode="numeric"
            min={1}
            max={720}
            value={form.duration}
            onChange={update('duration')}
            hint="Tiempo neto, sin descansos ni pausas."
            error={!parsed.ok && parsed.field === 'duration' ? parsed.error : null}
          />
          <TextAreaField label="Notas" rows={4} value={form.notes} onChange={update('notes')} />
        </div>
        {save.isError && (
          <Alert>
            {save.error instanceof SessionGoneError
              ? 'Esta sesión ya no existe: puede que la hayas eliminado en otro dispositivo.'
              : 'No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.'}
          </Alert>
        )}
        <Button type="submit" size="lg" disabled={save.isPending || !selected}>
          {save.isPending ? <Spinner /> : <Check className="size-5" />}
          Guardar cambios
        </Button>
      </form>
      <DeleteSessionPanel session={session} onDeleted={onDone} />
    </div>
  )
}
