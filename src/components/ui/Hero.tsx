import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

interface HeroProps extends HTMLAttributes<HTMLElement> {
  /** 'chrome' (negro) para lo que está detenido, como una sesión en pausa. */
  tone?: 'hero' | 'chrome'
}

/** El bloque de «lo de ahora»: uno por pantalla. En el móvil llega hasta los bordes. */
export function Hero({ tone = 'hero', className, ...props }: HeroProps) {
  return (
    <section
      data-surface="dark"
      className={cn(
        '-mx-4 px-4 py-8 transition-colors duration-300 sm:-mx-6 sm:px-6 lg:mx-0 lg:p-10',
        tone === 'hero'
          ? 'bg-hero text-hero-fg'
          : 'border-y border-border bg-chrome text-chrome-fg [--hero-muted:var(--chrome-muted)] lg:border',
        className,
      )}
      {...props}
    />
  )
}
