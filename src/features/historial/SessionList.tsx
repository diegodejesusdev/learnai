import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { findTopic } from '@/data/curriculum'
import { demoSessions } from '@/data/demo'
import { formatDuration, formatShortDate, formatTime } from '@/lib/dates'
import { studyModeLabels } from '@/lib/labels'

export function SessionList() {
  return (
    <Card className="p-2 sm:p-2">
      <ul className="divide-y divide-border">
        {demoSessions.map((session) => (
          <li key={session.id} className="flex items-center gap-3 px-2 py-3">
            <div className="flex w-18 shrink-0 flex-col text-center">
              <span className="text-sm font-semibold">{formatShortDate(session.startedAt)}</span>
              <span className="text-xs text-fg-muted">{formatTime(session.startedAt)}</span>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="truncate font-medium">
                {findTopic(session.topicId)?.topic.title}
              </span>
              <Badge className="self-start">{studyModeLabels[session.mode]}</Badge>
            </div>
            <span className="shrink-0 text-sm font-medium tabular-nums">
              {formatDuration(session.durationMinutes)}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  )
}
