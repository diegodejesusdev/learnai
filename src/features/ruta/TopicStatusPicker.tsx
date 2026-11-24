import { SegmentedControl } from '@/components/ui/SegmentedControl'
import type { ProgressStatus } from '@/types/progress'
import { statusOptions } from './statusOptions'
import { useSetTopicStatus } from './useProgress'

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
