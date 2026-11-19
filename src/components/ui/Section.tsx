import { useId, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface SectionProps {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}

export function Section({ title, description, action, children, className }: SectionProps) {
  const headingId = useId()
  return (
    <section aria-labelledby={headingId} className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 id={headingId} className="text-lg font-semibold tracking-tight">
            {title}
          </h2>
          {description && <p className="text-sm text-fg-muted">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}
