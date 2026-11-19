import { cn } from '@/lib/cn'

interface ProgressBarProps {
  /** Entre 0 y 1. */
  value: number
  label: string
  /** Muestra la etiqueta y el porcentaje encima de la barra. */
  showLabel?: boolean
  size?: 'sm' | 'md'
  className?: string
}

export function ProgressBar({
  value,
  label,
  showLabel = false,
  size = 'md',
  className,
}: ProgressBarProps) {
  const percent = Math.round(Math.min(1, Math.max(0, value)) * 100)
  return (
    <div className={className}>
      {showLabel && (
        <div className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
          <span className="text-fg-muted">{label}</span>
          <span className="font-medium tabular-nums">{percent} %</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className={cn('overflow-hidden rounded-full bg-border', size === 'sm' ? 'h-1.5' : 'h-2.5')}
      >
        <div
          className={cn(
            'h-full rounded-full transition-[width] duration-500',
            percent === 100 ? 'bg-done' : 'bg-accent',
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
