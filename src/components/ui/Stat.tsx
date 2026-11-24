import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface StatProps {
  label: string
  value: ReactNode
  hint?: string
  children?: ReactNode
  className?: string
}

/** Un número grande con su etiqueta y, debajo, qué significa. */
export function Stat({ label, value, hint, children, className }: StatProps) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1 border-t-2 border-fg pt-3', className)}>
      <div className="text-sm font-medium text-fg-muted">{label}</div>
      <p className="flex flex-wrap items-baseline gap-x-2 text-figure">{value}</p>
      {children}
      {hint && <p className="text-sm text-fg-muted">{hint}</p>}
    </div>
  )
}
