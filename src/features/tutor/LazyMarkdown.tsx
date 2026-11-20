import { lazy, Suspense } from 'react'

// react-markdown pesa casi 60 kB: se descarga aparte, así el Tutor abre antes.
// Mientras llega (un instante), la respuesta se ve como texto simple.
const MarkdownMessage = lazy(() =>
  import('./MarkdownMessage').then((module) => ({ default: module.MarkdownMessage })),
)

export function LazyMarkdown({ text }: { text: string }) {
  return (
    <Suspense
      fallback={<p className="text-[0.9375rem] leading-relaxed whitespace-pre-wrap">{text}</p>}
    >
      <MarkdownMessage text={text} />
    </Suspense>
  )
}
