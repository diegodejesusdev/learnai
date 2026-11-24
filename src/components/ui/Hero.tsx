import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

interface HeroProps extends HTMLAttributes<HTMLElement> {
  /** 'chrome' (negro) para lo que está detenido, como una sesión en pausa. */
  tone?: 'hero' | 'chrome'
}

/** El bloque de «lo de ahora»: uno por pantalla. */
export function Hero({ tone = 'hero', className, ...props }: HeroProps) {
  return (
    <section
      data-surface="dark"
      className={cn(
        'rounded-block px-5 py-7 transition-colors duration-300 sm:p-8 lg:p-10',
        tone === 'hero'
          ? 'bg-hero text-hero-fg'
          : 'border border-border bg-chrome text-chrome-fg [--hero-muted:var(--chrome-muted)]',
        className,
      )}
      {...props}
    />
  )
}
