import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { Topic } from '@/types/curriculum'
import type { ProgressStatus } from '@/types/progress'

export function TopicRow({ topic, status }: { topic: Topic; status: ProgressStatus }) {
  return (
    <Link
      to={`/ruta/tema/${topic.id}`}
      className="flex min-h-11 items-center gap-3 rounded-xl px-2 py-3 hover:bg-surface-muted"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-medium">{topic.title}</span>
          <StatusBadge status={status} />
        </div>
        <p className="line-clamp-2 text-sm text-fg-muted">{topic.details}</p>
      </div>
      <ChevronRight className="size-5 shrink-0 text-fg-muted" />
    </Link>
  )
}
