import { cn } from '@/lib/cn'

// Clases compartidas para que <button>, <Link>, filas y campos se vean igual.

/** inverse y outline van sobre los bloques oscuros (Hero, avisos). */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'inverse' | 'outline'
export type ButtonSize = 'md' | 'lg' | 'xl' | 'icon'

const buttonBase =
  'inline-flex select-none items-center justify-center gap-2 rounded-xs font-semibold transition-colors duration-150 active:opacity-80 disabled:cursor-not-allowed disabled:opacity-50'

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-action text-action-fg not-disabled:hover:bg-action-hover',
  secondary:
    'border border-control text-fg not-disabled:hover:border-fg not-disabled:hover:bg-fg not-disabled:hover:text-bg',
  ghost:
    'text-fg underline decoration-control underline-offset-4 not-disabled:hover:decoration-fg not-disabled:hover:decoration-2',
  danger:
    'border border-danger text-danger not-disabled:hover:bg-danger not-disabled:hover:text-danger-fg',
  inverse: 'bg-hero-fg text-hero not-disabled:hover:bg-hero-muted',
  outline:
    'border border-hero-fg/70 text-hero-fg not-disabled:hover:bg-hero-fg not-disabled:hover:text-hero',
}

// Todas las alturas cumplen el mínimo táctil de 44 px.
const buttonSizes: Record<ButtonSize, string> = {
  md: 'min-h-11 px-4 text-sm',
  lg: 'min-h-14 px-6 text-base',
  xl: 'min-h-18 px-4 text-lg tracking-tight sm:px-8 sm:text-xl',
  icon: 'size-12 shrink-0',
}

export function buttonClasses(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className?: string,
): string {
  return cn(buttonBase, buttonVariants[variant], buttonSizes[size], className)
}

export function cardClasses(className?: string): string {
  return cn('block border border-border bg-surface p-4 sm:p-6', className)
}

/** Fila de una lista que se toca: se marca con el fondo, sin moverse. */
export const rowClasses = 'transition-colors hover:bg-surface-muted active:bg-surface-muted'

export const fieldControlClasses =
  'w-full rounded-xs border border-control bg-surface px-3 text-base text-fg placeholder:text-fg-muted hover:border-fg disabled:opacity-60 disabled:hover:border-control'
