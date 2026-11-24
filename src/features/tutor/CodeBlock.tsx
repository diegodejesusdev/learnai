import { Check, Copy } from 'lucide-react'
import { isValidElement, useRef, useState, type ReactNode } from 'react'
import { copyText } from '@/lib/clipboard'
import { toast } from '@/lib/toast'

/** Lenguaje del bloque (```json → «json»), que react-markdown pone como clase del <code>. */
function languageOf(children: ReactNode): string | null {
  if (!isValidElement<{ className?: unknown }>(children)) return null
  const className = children.props.className
  return typeof className === 'string' ? (/language-([\w-]+)/.exec(className)?.[1] ?? null) : null
}

/** Bloque de código con su lenguaje y un botón para copiarlo. */
export function CodeBlock({ children }: { children?: ReactNode }) {
  const preRef = useRef<HTMLPreElement>(null)
  const [copied, setCopied] = useState(false)

  async function copy() {
    if (await copyText(preRef.current?.textContent ?? '')) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } else {
      toast.error('No se pudo copiar. Selecciona el código y cópialo a mano.')
    }
  }

  return (
    <div className="my-4 overflow-hidden border border-control bg-surface">
      <div className="flex items-center justify-between border-b border-border pl-3">
        <span className="text-sm text-fg-muted">{languageOf(children) ?? 'código'}</span>
        <button
          type="button"
          onClick={() => void copy()}
          className="flex min-h-11 items-center gap-1.5 px-3 text-sm font-semibold text-fg-muted hover:text-fg focus-visible:-outline-offset-4"
        >
          {copied ? <Check className="size-4 text-fg" /> : <Copy className="size-4" />}
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
      <pre ref={preRef} className="overflow-x-auto p-3 text-sm leading-relaxed">
        {children}
      </pre>
    </div>
  )
}
