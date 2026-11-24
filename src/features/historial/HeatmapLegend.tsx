import { cn } from '@/lib/cn'
import { heatLegend } from './heatmapModel'
import { levelClasses } from './heatmapStyles'

export function HeatmapLegend({ minMinutes }: { minMinutes: number }) {
  return (
    <ul aria-label="Leyenda" className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-fg-muted">
      {heatLegend(minMinutes).map(({ level, label }) => (
        <li key={level} className="flex items-center gap-2">
          <span className={cn('size-4', levelClasses[level])} />
          {label}
        </li>
      ))}
    </ul>
  )
}
