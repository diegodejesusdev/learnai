import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { formatDuration, formatShortDate } from '@/lib/dates'
import { toast } from '@/lib/toast'
import { SessionGoneError, type StudySession } from './sessionsApi'
import { useDeleteSession } from './useSessions'

interface DeleteSessionPanelProps {
  session: StudySession
  onDeleted: () => void
}

/** «Eliminar sesión» pide confirmación antes de borrar. */
export function DeleteSessionPanel({ session, onDeleted }: DeleteSessionPanelProps) {
  const [confirming, setConfirming] = useState(false)
  const remove = useDeleteSession(session.id)

  if (!confirming) {
    return (
      <Button
        variant="ghost"
        className="-ml-4 self-start text-danger"
        onClick={() => setConfirming(true)}
      >
        <Trash2 className="size-4" />
        Eliminar sesión
      </Button>
    )
  }

  const confirm = () =>
    remove.mutate(undefined, {
      onSuccess: () => {
        toast.success('Sesión eliminada.')
        onDeleted()
      },
      onError: (error) => {
        if (error instanceof SessionGoneError) {
          toast.success('Esta sesión ya se había eliminado.')
          onDeleted()
        }
      },
    })

  return (
    <Card
      role="group"
      aria-labelledby="delete-session-title"
      className="flex flex-col gap-4 border-danger"
    >
      <div className="flex flex-col gap-1">
        <p id="delete-session-title" className="text-title">
          ¿Eliminar esta sesión?
        </p>
        <p className="text-sm text-fg-muted">
          {formatShortDate(session.startedAt)} · {formatDuration(session.durationMinutes)}. Sus
          minutos dejarán de contar en la racha y en los totales. No se puede deshacer.
        </p>
      </div>
      {remove.isError && !(remove.error instanceof SessionGoneError) && (
        <Alert>No se pudo eliminar. Revisa tu conexión e inténtalo de nuevo.</Alert>
      )}
      <div className="flex flex-wrap gap-2">
        <Button variant="danger" disabled={remove.isPending} onClick={confirm}>
          {remove.isPending ? <Spinner /> : <Trash2 className="size-4" />}
          Sí, eliminar
        </Button>
        {/* El foco va a «Cancelar»: lo seguro si se pulsa Enter sin querer. */}
        <Button variant="secondary" autoFocus onClick={() => setConfirming(false)}>
          Cancelar
        </Button>
      </div>
    </Card>
  )
}
