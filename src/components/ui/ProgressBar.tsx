import { cn } from '@/lib/cn'

interface ProgressBarProps {
  /** Entre 0 y 1. */
  value: number
  label: string
  /** Muestra la etiqueta y el porcentaje encima de la barra. */
  showLabel?: boolean
  size?: 'sm' | 'md'
  /** 'accent': no cambia de color al llegar al 100 % (gráficas, donde lleno no es «hecho»). */
  tone?: 'accent'
  className?: string
}

export function ProgressBar({
  value,
  label,
  showLabel = false,
  size = 'md',
  tone,
  className,
}: ProgressBarProps) {
  const percent = Math.round(Math.min(1, Math.max(0, value)) * 100)
  return (
    <div className={className}>
      {showLabel && (
        <div className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
          <span className="text-fg-muted">{label}</span>
          <span className="font-bold tabular-nums">{percent} %</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className={cn('overflow-hidden rounded-full bg-track', size === 'sm' ? 'h-1' : 'h-2.5')}
      >
        <div
          className={cn(
            'h-full rounded-full transition-transform duration-500',
            percent === 100 && tone !== 'accent' ? 'bg-done' : 'bg-meter',
          )}
          style={{ transform: `translateX(${percent - 100}%)` }}
        />
      </div>
    </div>
  )
}
