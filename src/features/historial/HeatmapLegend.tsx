import { cn } from '@/lib/cn'
import { heatLegend } from './heatmapModel'
import { levelClasses } from './heatmapStyles'

export function HeatmapLegend({ minMinutes }: { minMinutes: number }) {
  return (
    <ul aria-label="Leyenda" className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-fg-muted">
      {heatLegend(minMinutes).map(({ level, label }) => (
        <li key={level} className="flex items-center gap-1.5">
          <span className={cn('size-3 rounded-[3px]', levelClasses[level])} />
          {label}
        </li>
      ))}
    </ul>
  )
}
