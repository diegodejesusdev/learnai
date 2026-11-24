import { Link } from 'react-router'
import { rowClasses } from '@/components/ui/styles'
import { cn } from '@/lib/cn'
import type { Topic } from '@/types/curriculum'
import type { ProgressStatus } from '@/types/progress'
import { StatusToggle } from './StatusToggle'

/** Un tema: a la izquierda su estado (se toca para avanzarlo) y al lado el enlace al tema. */
export function TopicRow({ topic, status }: { topic: Topic; status: ProgressStatus }) {
  return (
    <div className="flex items-stretch">
      <StatusToggle topicId={topic.id} topicTitle={topic.title} status={status} />
      <Link
        to={`/ruta/tema/${topic.id}`}
        className={cn(rowClasses, 'flex min-w-0 flex-1 flex-col gap-1 py-4 pr-2 pl-2')}
      >
        <span className="flex flex-wrap items-baseline justify-between gap-x-3">
          <span className="text-lg leading-snug font-bold tracking-tight">{topic.title}</span>
          {status === 'en_curso' && (
            <span aria-hidden className="text-sm font-semibold text-accent">
              En curso
            </span>
          )}
        </span>
        <span className="line-clamp-2 text-sm text-fg-muted">{topic.details}</span>
      </Link>
    </div>
  )
}
