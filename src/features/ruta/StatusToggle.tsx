import { StatusIcon } from '@/components/ui/StatusIcon'
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
      title={statusLabels[status]}
      className="-ml-3 flex w-13 shrink-0 justify-center pt-4 transition-transform active:scale-90"
    >
      <StatusIcon status={status} className="size-7" />
    </button>
  )
}
