import { CircleCheck, CircleDashed, CircleDot } from 'lucide-react'
import { SegmentedControl, type SegmentedOption } from '@/components/ui/SegmentedControl'
import { statusLabels } from '@/lib/labels'
import type { ProgressStatus } from '@/types/progress'
import { useSetTopicStatus } from './useProgress'

const statusOptions: readonly SegmentedOption<ProgressStatus>[] = [
  { value: 'pendiente', label: statusLabels.pendiente, icon: CircleDashed },
  { value: 'en_curso', label: statusLabels.en_curso, icon: CircleDot },
  { value: 'hecho', label: statusLabels.hecho, icon: CircleCheck },
]

export function TopicStatusPicker({
  topicId,
  status,
}: {
  topicId: string
  status: ProgressStatus
}) {
  const setStatus = useSetTopicStatus()
  return (
    <SegmentedControl
      label="Estado del tema"
      options={statusOptions}
      value={status}
      onChange={(next) => setStatus.mutate({ topicId, status: next })}
    />
  )
}
