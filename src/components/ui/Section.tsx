import { useId, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface SectionProps {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
  /** En el PC, el título a la izquierda y el contenido a la derecha (formularios, ajustes). */
  split?: boolean
  className?: string
}

/** Bloque de una página: una línea gruesa, el título y su contenido. */
export function Section({
  title,
  description,
  action,
  children,
  split = false,
  className,
}: SectionProps) {
  const headingId = useId()
  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        'flex flex-col gap-5 border-t-2 border-fg pt-5',
        split && 'lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-x-12',
        className,
      )}
    >
      <div className={cn('flex items-start justify-between gap-4', split && 'lg:flex-col')}>
        <div className="flex flex-col gap-1">
          <h2 id={headingId} className="text-title">
            {title}
          </h2>
          {description && <p className="max-w-2xl text-sm text-fg-muted">{description}</p>}
        </div>
        {action}
      </div>
      {split ? <div className="flex min-w-0 flex-col gap-4">{children}</div> : children}
    </section>
  )
}
