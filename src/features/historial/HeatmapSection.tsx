import { useSearchParams } from 'react-router'
import { ErrorState } from '@/components/ui/ErrorState'
import { LoadingState } from '@/components/ui/LoadingState'
import { Section } from '@/components/ui/Section'
import { useUserSettings } from '@/features/ajustes/useUserSettings'
import type { Track } from '@/lib/roadmap'
import { DayDetail } from './DayDetail'
import { Heatmap } from './Heatmap'
import { HeatmapLegend } from './HeatmapLegend'
import { heatmapWeeks } from './heatmapModel'
import { todayKey, useDayTotals } from './useStudyStats'

const HEATMAP_MONTHS = 6

export function HeatmapSection({ tracks }: { tracks: readonly Track[] }) {
  const days = useDayTotals()
  const settings = useUserSettings()
  const [params, setParams] = useSearchParams()
  const today = todayKey()

  let content
  if (days.isError) {
    content = (
      <ErrorState
        title="No pudimos cargar tus días de estudio"
        onRetry={() => void days.refetch()}
      />
    )
  } else if (!days.data || !settings.data) {
    content = <LoadingState />
  } else {
    const minMinutes = settings.data.streak_min_minutes
    const weeks = heatmapWeeks(days.data, today, HEATMAP_MONTHS, minMinutes)
    const firstDay = weeks[0]?.weekStart ?? today
    // El día elegido va en la URL (?dia=…) para conservarlo al volver de editar una sesión.
    const requested = params.get('dia') ?? ''
    const selected =
      /^\d{4}-\d{2}-\d{2}$/.test(requested) && requested >= firstDay && requested <= today
        ? requested
        : today
    const select = (day: string) => {
      const next = new URLSearchParams(params)
      next.set('dia', day)
      void setParams(next, { replace: true, preventScrollReset: true })
    }

    content = (
      <>
        <div className="flex flex-col gap-4">
          <Heatmap weeks={weeks} selected={selected} onSelect={select} />
          <HeatmapLegend minMinutes={minMinutes} />
        </div>
        <DayDetail
          day={selected}
          today={today}
          total={days.data.find((total) => total.day === selected)}
          minMinutes={minMinutes}
          tracks={tracks}
        />
      </>
    )
  }

  return (
    <Section
      title="Mapa de calor"
      description="Últimos 6 meses. Toca un día para ver sus sesiones."
    >
      {content}
    </Section>
  )
}
