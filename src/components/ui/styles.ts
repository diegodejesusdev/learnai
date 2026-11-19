import { cn } from '@/lib/cn'

// Clases compartidas para que <button>, <Link> y tarjetas enlazadas se vean igual.

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'md' | 'lg' | 'icon'

const buttonBase =
  'inline-flex select-none items-center justify-center gap-2 rounded-xl font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50'

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-fg hover:bg-accent-hover',
  secondary: 'border border-border bg-surface text-fg hover:bg-surface-muted',
  ghost: 'text-fg hover:bg-surface-muted',
  danger: 'bg-danger text-danger-fg hover:opacity-90',
}

// Todas las alturas cumplen el mínimo táctil de 44 px.
const buttonSizes: Record<ButtonSize, string> = {
  md: 'min-h-11 px-4 text-sm',
  lg: 'min-h-12 px-5 text-base',
  icon: 'size-11',
}

export function buttonClasses(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className?: string,
): string {
  return cn(buttonBase, buttonVariants[variant], buttonSizes[size], className)
}

export function cardClasses(interactive = false, className?: string): string {
  return cn(
    'block rounded-2xl border border-border bg-surface p-4 sm:p-5',
    interactive && 'transition-colors hover:border-accent/50 hover:bg-surface-muted',
    className,
  )
}

export const fieldControlClasses =
  'w-full rounded-xl border border-border bg-surface px-3 text-base text-fg placeholder:text-fg-muted/70 disabled:opacity-60'
