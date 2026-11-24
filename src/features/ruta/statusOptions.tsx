import type { SegmentedOption } from '@/components/ui/SegmentedControl'
import { StatusIcon } from '@/components/ui/StatusIcon'
import { statusLabels } from '@/lib/labels'
import type { ProgressStatus } from '@/types/progress'

const statuses: readonly ProgressStatus[] = ['pendiente', 'en_curso', 'hecho']

/** Opciones de estado para el selector de un tema o de un proyecto. */
export const statusOptions: readonly SegmentedOption<ProgressStatus>[] = statuses.map((status) => ({
  value: status,
  label: statusLabels[status],
  icon: ({ className }) => <StatusIcon status={status} mono className={className} />,
}))
