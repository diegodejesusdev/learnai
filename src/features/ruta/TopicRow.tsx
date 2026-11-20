import { Link } from 'react-router'
import type { Topic } from '@/types/curriculum'
import type { ProgressStatus } from '@/types/progress'
import { StatusToggle } from './StatusToggle'

export function TopicRow({ topic, status }: { topic: Topic; status: ProgressStatus }) {
  return (
    <div className="flex items-center gap-1">
      <Link
        to={`/ruta/tema/${topic.id}`}
        className="flex min-h-11 min-w-0 flex-1 flex-col gap-1 rounded-xl px-2 py-3 hover:bg-surface-muted"
      >
        <span className="font-medium">{topic.title}</span>
        <span className="line-clamp-2 text-sm text-fg-muted">{topic.details}</span>
      </Link>
      <StatusToggle topicId={topic.id} topicTitle={topic.title} status={status} />
    </div>
  )
}
