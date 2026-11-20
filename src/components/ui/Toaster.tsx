import { CircleAlert, CircleCheck, X } from 'lucide-react'
import { useSyncExternalStore } from 'react'
import { cn } from '@/lib/cn'
import { dismissToast, getToasts, subscribeToToasts } from '@/lib/toast'

/** Muestra los avisos de lib/toast. En el móvil quedan encima de la barra inferior. */
export function Toaster() {
  const items = useSyncExternalStore(subscribeToToasts, getToasts)

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-40 flex flex-col items-center gap-2 px-4 lg:bottom-6 lg:pl-64">
      {items.map((item) => {
        const Icon = item.tone === 'error' ? CircleAlert : CircleCheck
        return (
          <div
            key={item.id}
            role={item.tone === 'error' ? 'alert' : 'status'}
            className="pointer-events-auto flex w-full max-w-sm items-start gap-2 rounded-xl border border-border bg-surface-raised py-2 pr-1 pl-3 text-sm shadow-lg"
          >
            <Icon
              className={cn(
                'mt-0.5 size-4 shrink-0',
                item.tone === 'error' ? 'text-danger' : 'text-done',
              )}
            />
            <p className="flex-1 py-0.5">{item.message}</p>
            <button
              type="button"
              aria-label="Cerrar aviso"
              onClick={() => dismissToast(item.id)}
              className="-my-1 flex size-9 shrink-0 items-center justify-center rounded-lg text-fg-muted hover:bg-surface-muted hover:text-fg"
            >
              <X className="size-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
