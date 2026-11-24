import { Check, Trash2 } from 'lucide-react'
import { onlineManager } from '@tanstack/react-query'
import { useState } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { TextAreaField } from '@/components/ui/TextAreaField'
import { TextField } from '@/components/ui/TextField'
import { formatDuration, formatTime } from '@/lib/dates'
import { toast } from '@/lib/toast'
import { useNow } from '@/lib/useNow'
import { sessionDraft, type ActiveTimer } from './timerModel'
import { useFinishSession, useTimerChange } from './useActiveTimer'

interface FinishSessionFormProps {
  timer: ActiveTimer
  title: string
  /** El tema (o proyecto) ya está «hecho»: no se ofrece marcarlo. */
  alreadyDone: boolean
  onBack: () => void
}

export function FinishSessionForm({ timer, title, alreadyDone, onBack }: FinishSessionFormProps) {
  const now = useNow(false)
  const draft = sessionDraft(timer, now)
  const [duration, setDuration] = useState(String(draft.durationMinutes))
  const [notes, setNotes] = useState('')
  const [markDone, setMarkDone] = useState(false)
  const [confirmDiscard, setConfirmDiscard] = useState(draft.tooShort)
  const finish = useFinishSession()
  const change = useTimerChange()

  const minutes = Number(duration)
  const durationError =
    Number.isInteger(minutes) && minutes >= 1 && minutes <= draft.maxMinutes
      ? null
      : `Escribe un número entero entre 1 y ${draft.maxMinutes}.`

  if (confirmDiscard) {
    return (
      <div className="flex max-w-2xl flex-col gap-5 border-t-2 border-fg pt-5">
        <h2 className="text-lead">
          {draft.tooShort ? 'La sesión duró menos de 1 minuto' : '¿Descartar esta sesión?'}
        </h2>
        <p className="text-fg-muted">
          {draft.tooShort
            ? 'Las sesiones de menos de un minuto no se guardan. ¿La descartas?'
            : `Se perderán ${formatDuration(draft.focusSeconds / 60)} de estudio en «${title}».`}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="danger"
            onClick={() => change.mutate({ kind: 'discard' })}
            disabled={change.isPending}
          >
            <Trash2 className="size-4" />
            Descartar sesión
          </Button>
          <Button
            variant="secondary"
            onClick={draft.tooShort ? onBack : () => setConfirmDiscard(false)}
          >
            {draft.tooShort ? 'Volver al temporizador' : 'No, volver'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form
      className="flex max-w-2xl flex-col gap-6 xl:max-w-none"
      onSubmit={(event) => {
        event.preventDefault()
        if (durationError) return
        const offline = !onlineManager.isOnline()
        finish.mutate(
          {
            sessionId: timer.sessionId,
            startedAt: timer.startedAt,
            mode: timer.mode,
            topicId: timer.topicId,
            projectPhaseId: timer.projectPhaseId,
            endedAt: draft.endedAt,
            durationMinutes: minutes,
            notes: notes.trim(),
            markDone,
          },
          {
            onSuccess: () => {
              if (!offline)
                toast.success(`Sesión guardada: ${formatDuration(minutes)} en «${title}».`)
            },
          },
        )
        if (offline) {
          toast.success(
            `Sin conexión: la sesión (${formatDuration(minutes)}) quedó en este dispositivo y se subirá al volver internet.`,
          )
        }
      }}
    >
      <div className="flex flex-col gap-2 border-t-2 border-fg pt-5">
        <h2 className="text-lead">Terminar sesión</h2>
        <p className="text-fg-muted">
          {title} · de {formatTime(timer.startedAt)} a {formatTime(draft.endedAt)}
        </p>
      </div>
      <div className="flex flex-col gap-5 xl:grid xl:grid-cols-2 xl:items-start xl:gap-x-14">
        <TextField
          label="Duración (minutos de estudio)"
          type="number"
          inputMode="numeric"
          min={1}
          max={draft.maxMinutes}
          value={duration}
          onChange={(event) => setDuration(event.target.value)}
          hint={
            timer.mode === 'pomodoro'
              ? 'Solo cuentan los bloques de trabajo; las pausas y descansos no.'
              : 'Las pausas no cuentan.'
          }
          error={durationError}
        />
        <TextAreaField
          label="¿Qué aprendiste?"
          rows={5}
          placeholder="Ideas clave, dudas, qué falta…"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
        {alreadyDone ? (
          <p className="text-sm text-fg-muted">«{title}» ya está marcado como hecho.</p>
        ) : (
          <label className="flex min-h-11 cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={markDone}
              onChange={(event) => setMarkDone(event.target.checked)}
              className="size-6 shrink-0 accent-[var(--meter)]"
            />
            <span>Marcar «{title}» como hecho</span>
          </label>
        )}
      </div>
      {finish.isError && (
        <Alert>No se pudo guardar la sesión. Revisa tu conexión e inténtalo de nuevo.</Alert>
      )}
      {finish.isPaused && (
        <Alert>Sin conexión: la sesión se guardará en cuanto vuelva internet.</Alert>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="submit"
          size="lg"
          disabled={finish.isPending || durationError !== null}
          className="sm:flex-1"
        >
          {finish.isPending ? <Spinner /> : <Check className="size-5" />}
          Guardar sesión
        </Button>
        <Button type="button" size="lg" variant="secondary" onClick={onBack}>
          Volver al temporizador
        </Button>
      </div>
      <Button
        type="button"
        variant="ghost"
        className="-ml-4 self-start text-danger"
        onClick={() => setConfirmDiscard(true)}
      >
        <Trash2 className="size-4" />
        Descartar sesión
      </Button>
    </form>
  )
}
