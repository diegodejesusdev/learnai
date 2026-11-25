import { ChevronDown } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { cn } from '@/lib/cn'
import type { LessonHeading, LessonSection } from '@/lib/lessonSections'
import { useMediaQuery, WIDE_SCREEN } from '@/lib/useMediaQuery'
import { useActiveHeading } from './useActiveHeading'

interface IndexListProps {
  sections: readonly LessonSection[]
  active?: string
  onSelect?: () => void
}

function IndexList({ sections, active, onSelect }: IndexListProps) {
  const item = ({ id, title }: LessonHeading, nested: boolean) => (
    <Link
      to={{ hash: id }}
      // Ir de sección en sección no llena el botón «atrás».
      replace
      onClick={onSelect}
      aria-current={active === id ? 'location' : undefined}
      className={cn(
        'flex min-h-11 items-center border-l-2 py-1.5 text-sm transition-colors xl:min-h-8',
        nested ? 'pl-7' : 'pl-4 font-semibold',
        active === id
          ? 'border-meter text-accent'
          : 'border-border text-fg-muted hover:border-fg hover:text-fg',
      )}
    >
      {title}
    </Link>
  )
  return (
    <ul>
      {sections.map((section) => (
        <li key={section.id}>
          {item(section, false)}
          {section.subheadings.length > 0 && (
            <ul>
              {section.subheadings.map((heading) => (
                <li key={heading.id}>{item(heading, true)}</li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  )
}

/** En el PC, siempre a la vista y con la sección que estás leyendo marcada. */
function FixedIndex({ sections }: { sections: readonly LessonSection[] }) {
  const ids = useMemo(
    () => sections.flatMap(({ id, subheadings }) => [id, ...subheadings.map((h) => h.id)]),
    [sections],
  )
  return <IndexList sections={sections} active={useActiveHeading(ids)} />
}

function CollapsibleIndex({ sections }: { sections: readonly LessonSection[] }) {
  const [open, setOpen] = useState(false)
  const listId = useId()
  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen(!open)}
        className="flex min-h-12 w-full items-center justify-between gap-3 font-bold"
      >
        En esta lección
        <ChevronDown className={cn('size-5 transition-transform', open && 'rotate-180')} />
      </button>
      <div id={listId} className={cn(open && 'pb-4')}>
        {open && <IndexList sections={sections} onSelect={() => setOpen(false)} />}
      </div>
    </>
  )
}

/** Índice de secciones: desplegable en el móvil, fijo en el PC. */
export function LessonIndex({ sections }: { sections: readonly LessonSection[] }) {
  const wide = useMediaQuery(WIDE_SCREEN)
  const titled = useMemo(() => sections.filter((section) => section.title !== ''), [sections])
  return (
    <nav
      aria-label="Índice de la lección"
      className="border-y border-border xl:border-0 wide:max-h-[calc(100dvh-4rem-var(--banner-height,0px))] wide:overflow-y-auto"
    >
      {wide ? <FixedIndex sections={titled} /> : <CollapsibleIndex sections={titled} />}
    </nav>
  )
}
