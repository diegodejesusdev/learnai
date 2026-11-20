import { Clock, Flame } from 'lucide-react'
import { DemoNotice } from '@/components/ui/DemoNotice'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { demoStats } from '@/data/demo'
import { NextTopicCard } from '@/features/ruta/NextTopicCard'
import { RoadmapGate } from '@/features/ruta/RoadmapGate'
import { useTodayMinutes } from '@/features/temporizador/useActiveTimer'
import { formatDuration, formatLongDate } from '@/lib/dates'
import { TotalProgressCard } from './TotalProgressCard'
import { WeeklyGoalCard } from './WeeklyGoalCard'

export function HomePage() {
  const today = useTodayMinutes()
  return (
    <>
      <PageHeader title="Inicio" description={formatLongDate(new Date())} />
      <div className="flex flex-col gap-4">
        <RoadmapGate>
          {(roadmapData) => (
            <>
              <NextTopicCard {...roadmapData} />
              <TotalProgressCard {...roadmapData} />
            </>
          )}
        </RoadmapGate>
        <DemoNotice>La racha y la meta semanal son de ejemplo hasta la fase 5.</DemoNotice>
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            icon={Clock}
            label="Hoy"
            value={
              today.isError ? '—' : today.data === undefined ? '…' : formatDuration(today.data)
            }
          />
          <StatCard
            icon={Flame}
            label="Racha"
            value={`${demoStats.currentStreak} días`}
            hint={`Máxima: ${demoStats.maxStreak} días`}
          />
        </div>
        <WeeklyGoalCard minutes={demoStats.weekMinutes} goalMinutes={demoStats.weeklyGoalMinutes} />
      </div>
    </>
  )
}
