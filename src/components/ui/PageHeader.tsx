import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'

interface PageHeaderProps {
  title: string
  description?: ReactNode
  /** Enlace de vuelta, p. ej. de un tema a su fase. */
  back?: { to: string; label: string }
  eyebrow?: ReactNode
}

export function PageHeader({ title, description, back, eyebrow }: PageHeaderProps) {
  return (
    <header className="mb-8 flex flex-col gap-2 lg:mb-12 lg:gap-3">
      <title>{`${title} · LearnAI`}</title>
      {back && (
        <Link
          to={back.to}
          className="inline-flex min-h-11 w-fit max-w-full items-center gap-1.5 text-sm font-semibold text-fg-muted transition-colors hover:text-accent"
        >
          <ArrowLeft className="size-4 shrink-0" />
          {back.label}
        </Link>
      )}
      {eyebrow && <div className="text-sm font-semibold text-accent">{eyebrow}</div>}
      <h1 className="text-display text-balance wrap-break-word hyphens-auto">{title}</h1>
      {description && (
        <p className="max-w-2xl text-pretty text-fg-muted lg:text-lg">{description}</p>
      )}
    </header>
  )
}
