import { Clock, Flame } from 'lucide-react'
import { DemoNotice } from '@/components/ui/DemoNotice'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { demoStats } from '@/data/demo'
import { NextTopicCard } from '@/features/ruta/NextTopicCard'
import { RoadmapGate } from '@/features/ruta/RoadmapGate'
import { formatDuration, formatLongDate } from '@/lib/dates'
import { TotalProgressCard } from './TotalProgressCard'
import { WeeklyGoalCard } from './WeeklyGoalCard'

export function HomePage() {
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
        <DemoNotice>
          Los minutos, la racha y la meta semanal son de ejemplo hasta las fases 4 y 5.
        </DemoNotice>
        <div className="grid grid-cols-2 gap-4">
          <StatCard icon={Clock} label="Hoy" value={formatDuration(demoStats.todayMinutes)} />
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
