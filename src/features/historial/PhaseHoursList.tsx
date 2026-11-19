import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { findTopic, phaseLabel, phases } from '@/data/curriculum'
import { demoSessions } from '@/data/demo'
import { formatDuration } from '@/lib/dates'

function minutesByPhase(): Map<string, number> {
  const totals = new Map<string, number>()
  for (const session of demoSessions) {
    const phaseId = findTopic(session.topicId)?.phase.id
    if (phaseId) totals.set(phaseId, (totals.get(phaseId) ?? 0) + session.durationMinutes)
  }
  return totals
}

export function PhaseHoursList() {
  const totals = minutesByPhase()
  const max = Math.max(1, ...totals.values())
  const rows = phases.filter((phase) => totals.has(phase.id))

  return (
    <Card className="flex flex-col gap-4">
      {rows.map((phase) => {
        const minutes = totals.get(phase.id) ?? 0
        return (
          <div key={phase.id} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate">
                <span className="text-fg-muted">{phaseLabel(phase)} · </span>
                {phase.title}
              </span>
              <span className="shrink-0 font-medium tabular-nums">{formatDuration(minutes)}</span>
            </div>
            <ProgressBar value={minutes / max} label={`Tiempo en ${phase.title}`} size="sm" />
          </div>
        )
      })}
    </Card>
  )
}
