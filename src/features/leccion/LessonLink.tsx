import { ExternalLink } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'

/** Enlace dentro de una lección: los externos abren en otra pestaña. */
export function LessonLink({ href = '', children }: { href?: string; children?: ReactNode }) {
  // Una sola barra: «//sitio.com» también es externo.
  if (/^(\/(?!\/)|#)/.test(href)) return <Link to={href}>{children}</Link>
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <ExternalLink aria-hidden className="ml-1 inline size-3.5 align-baseline" />
      {/* El espacio va aparte: dentro del texto oculto se perdería al leerlo en voz alta. */}{' '}
      <span className="sr-only">(se abre en otra pestaña)</span>
    </a>
  )
}
