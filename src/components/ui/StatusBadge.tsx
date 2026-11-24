import { cn } from '@/lib/cn'
import { statusLabels } from '@/lib/labels'
import type { ProgressStatus } from '@/types/progress'
import { StatusIcon } from './StatusIcon'

const tones: Record<ProgressStatus, string> = {
  pendiente: 'text-pending',
  en_curso: 'text-progress',
  hecho: 'text-done',
}

/** Estado con forma y texto (nunca solo color). */
export function StatusBadge({ status }: { status: ProgressStatus }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold whitespace-nowrap',
        tones[status],
      )}
    >
      <StatusIcon status={status} className="size-4" />
      {statusLabels[status]}
    </span>
  )
}
