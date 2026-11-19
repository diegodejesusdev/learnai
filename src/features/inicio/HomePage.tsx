import { Clock, Flame } from 'lucide-react'
import { DemoNotice } from '@/components/ui/DemoNotice'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { demoStats } from '@/data/demo'
import { formatDuration, formatLongDate } from '@/lib/dates'
import { ContinueStudyingCard } from './ContinueStudyingCard'
import { TotalProgressCard } from './TotalProgressCard'
import { WeeklyGoalCard } from './WeeklyGoalCard'

export function HomePage() {
  return (
    <>
      <PageHeader title="Inicio" description={formatLongDate(new Date())} />
      <DemoNotice>
        Vista previa con datos de ejemplo. Tus datos reales llegan al conectar Supabase.
      </DemoNotice>
      <div className="flex flex-col gap-4">
        <ContinueStudyingCard topicId={demoStats.lastTopicId} />
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
        <TotalProgressCard />
      </div>
    </>
  )
}
