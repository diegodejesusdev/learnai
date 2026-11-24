import { cn } from '@/lib/cn'
import type { ProgressStatus } from '@/types/progress'

interface StatusIconProps {
  status: ProgressStatus
  /** Solo líneas y del color del texto, para ir dentro de un botón. */
  mono?: boolean
  className?: string
}

/** Vacío (pendiente), medio (en curso) o lleno con check (hecho): se distingue sin el color. */
export function StatusIcon({ status, mono = false, className }: StatusIconProps) {
  const done = status === 'hecho'
  const filled = done && !mono
  const ring = mono ? 'stroke-current' : status === 'en_curso' ? 'stroke-meter' : 'stroke-control'
  return (
    <svg viewBox="0 0 24 24" className={cn('shrink-0', className ?? 'size-6')} aria-hidden="true">
      {filled ? (
        <circle cx="12" cy="12" r="11" className="fill-done" />
      ) : (
        <circle cx="12" cy="12" r="10" className={cn('fill-none', ring)} strokeWidth="2" />
      )}
      {status === 'en_curso' && (
        <path d="M12 6a6 6 0 0 1 0 12z" className={mono ? 'fill-current' : 'fill-meter'} />
      )}
      {done && (
        <path
          d="m7 12.5 3.4 3.4L17 9"
          className={cn('fill-none', mono ? 'stroke-current' : 'stroke-done-fg')}
          strokeWidth="2.5"
          strokeLinecap="square"
        />
      )}
    </svg>
  )
}
