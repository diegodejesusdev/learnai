import { useMemo } from 'react'
import Markdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { CodeBlock } from '@/components/ui/CodeBlock'
import type { LessonSubheading } from '@/lib/lessonSections'
import { HighlightedCode } from './HighlightedCode'
import { LessonImage } from './LessonImage'
import { LessonLink } from './LessonLink'
import { remarkLessonFigure } from './remarkLessonFigure'

// react-markdown no interpreta HTML crudo ni enlaces peligrosos (javascript:…).
function componentsFor(subheadings: readonly LessonSubheading[]): Components {
  const idAt = new Map(subheadings.map(({ line, id }) => [line, id]))
  return {
    h3: ({ node, children }) => <h3 id={idAt.get(node?.position?.start.line ?? 0)}>{children}</h3>,
    figure: ({ children }) => <figure>{children}</figure>,
    figcaption: ({ children }) => (
      <figcaption className="mt-2 text-sm text-fg-muted italic">{children}</figcaption>
    ),
    img: ({ src, alt }) => <LessonImage src={typeof src === 'string' ? src : ''} alt={alt} />,
    pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
    code: ({ className, children }) => (
      <HighlightedCode className={className}>{children}</HighlightedCode>
    ),
    a: ({ href, children }) => <LessonLink href={href}>{children}</LessonLink>,
    table: ({ children }) => (
      // tabIndex: se puede desplazar de lado también con las flechas.
      <div role="group" aria-label="Tabla" tabIndex={0} className="overflow-x-auto">
        <table>{children}</table>
      </div>
    ),
  }
}

interface LessonMarkdownProps {
  text: string
  subheadings: readonly LessonSubheading[]
}

/** El Markdown de una sección de la lección. */
export function LessonMarkdown({ text, subheadings }: LessonMarkdownProps) {
  // Los mismos componentes en cada render: si cambiaran, React volvería a montar todo.
  const components = useMemo(() => componentsFor(subheadings), [subheadings])
  return (
    <div className="markdown lesson">
      <Markdown remarkPlugins={[remarkGfm, remarkLessonFigure]} components={components}>
        {text}
      </Markdown>
    </div>
  )
}
