import { CircleCheck, CircleDashed, CircleDot, type LucideIcon } from 'lucide-react'
import { statusLabels } from '@/lib/labels'
import type { ProgressStatus } from '@/types/progress'
import { Badge, type BadgeTone } from './Badge'

const statusStyles: Record<ProgressStatus, { tone: BadgeTone; Icon: LucideIcon }> = {
  pendiente: { tone: 'pending', Icon: CircleDashed },
  en_curso: { tone: 'progress', Icon: CircleDot },
  hecho: { tone: 'done', Icon: CircleCheck },
}

/** Estado con color, icono y texto (nunca solo color). */
export function StatusBadge({ status }: { status: ProgressStatus }) {
  const { tone, Icon } = statusStyles[status]
  return (
    <Badge tone={tone} icon={<Icon className="size-3.5" strokeWidth={2.25} />}>
      {statusLabels[status]}
    </Badge>
  )
}
