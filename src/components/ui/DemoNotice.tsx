import { Info } from 'lucide-react'

/** Aviso temporal mientras las pantallas muestran datos de ejemplo. */
export function DemoNotice({ children }: { children: string }) {
  return (
    <p className="mb-5 flex items-start gap-2 rounded-xl bg-accent-soft px-3 py-2 text-sm text-accent-soft-fg">
      <Info className="mt-0.5 size-4 shrink-0" />
      {children}
    </p>
  )
}
