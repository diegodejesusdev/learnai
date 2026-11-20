import { StatusBadge } from '@/components/ui/StatusBadge'
import { statusLabels } from '@/lib/labels'
import { nextStatus } from '@/lib/progress'
import type { ProgressStatus } from '@/types/progress'
import { useSetTopicStatus } from './useProgress'

interface StatusToggleProps {
  topicId: string
  topicTitle: string
  status: ProgressStatus
}

/** Un toque avanza el estado del tema: pendiente → en curso → hecho → pendiente. */
export function StatusToggle({ topicId, topicTitle, status }: StatusToggleProps) {
  const setStatus = useSetTopicStatus()
  const next = nextStatus(status)

  return (
    <button
      type="button"
      onClick={() => setStatus.mutate({ topicId, status: next })}
      aria-label={`Estado de «${topicTitle}»: ${statusLabels[status]}. Toca para cambiar a ${statusLabels[next]}.`}
      // Ancho fijo para que la fila no salte al cambiar de «Pendiente» a «Hecho».
      className="flex min-h-11 w-28 shrink-0 items-center justify-end rounded-xl pr-1 hover:bg-surface-muted"
    >
      <StatusBadge status={status} />
    </button>
  )
}
