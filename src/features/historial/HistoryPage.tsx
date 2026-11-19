import { CalendarDays, Download, Flame, Target, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DemoNotice } from '@/components/ui/DemoNotice'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { Section } from '@/components/ui/Section'
import { StatCard } from '@/components/ui/StatCard'
import { demoStats } from '@/data/demo'
import { formatDuration } from '@/lib/dates'
import { PhaseHoursList } from './PhaseHoursList'
import { SessionList } from './SessionList'

export function HistoryPage() {
  const { currentStreak, maxStreak, weekMinutes, weeklyGoalMinutes } = demoStats
  return (
    <>
      <PageHeader
        title="Historial"
        description="Tu constancia y el tiempo invertido, en hora de Colombia."
      />
      <DemoNotice>Sesiones de ejemplo. El historial real llega en la fase 5.</DemoNotice>
      <div className="flex flex-col gap-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard icon={Flame} label="Racha actual" value={`${currentStreak} días`} />
          <StatCard icon={Trophy} label="Racha máxima" value={`${maxStreak} días`} />
          <StatCard
            className="col-span-2 sm:col-span-1"
            icon={Target}
            label="Esta semana"
            value={formatDuration(weekMinutes)}
            hint={`Meta: ${formatDuration(weeklyGoalMinutes)}`}
          />
        </div>
        <Section title="Mapa de calor">
          <EmptyState
            icon={CalendarDays}
            title="Pronto verás aquí tus días de estudio"
            description="Cada día se coloreará según los minutos que estudies."
          />
        </Section>
        <Section title="Horas por fase">
          <PhaseHoursList />
        </Section>
        <Section
          title="Sesiones"
          action={
            <Button variant="secondary" disabled>
              <Download className="size-4" />
              CSV
            </Button>
          }
        >
          <SessionList />
        </Section>
      </div>
    </>
  )
}
