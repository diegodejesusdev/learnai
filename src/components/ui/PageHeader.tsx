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
    <header className="mb-6 flex flex-col gap-1">
      <title>{`${title} · LearnAI`}</title>
      {back && (
        <Link
          to={back.to}
          className="mb-1 -ml-2 inline-flex min-h-11 w-fit items-center gap-1 rounded-xl px-2 text-sm font-medium text-fg-muted hover:text-fg"
        >
          <ArrowLeft className="size-4" />
          {back.label}
        </Link>
      )}
      {eyebrow && <div className="text-sm font-medium text-accent">{eyebrow}</div>}
      <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{title}</h1>
      {description && <p className="text-pretty text-fg-muted">{description}</p>}
    </header>
  )
}
