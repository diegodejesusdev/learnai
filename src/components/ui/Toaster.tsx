import { CircleAlert, CircleCheck, X } from 'lucide-react'
import { useSyncExternalStore } from 'react'
import { cn } from '@/lib/cn'
import { dismissToast, getToasts, subscribeToToasts } from '@/lib/toast'

/** Muestra los avisos de lib/toast. En el móvil quedan encima de la barra inferior. */
export function Toaster() {
  const items = useSyncExternalStore(subscribeToToasts, getToasts)

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-40 flex flex-col items-center gap-2 px-4 lg:bottom-6 lg:pl-60">
      {items.map((item) => {
        const Icon = item.tone === 'error' ? CircleAlert : CircleCheck
        return (
          <div
            key={item.id}
            role={item.tone === 'error' ? 'alert' : 'status'}
            data-surface={item.tone === 'error' ? undefined : 'dark'}
            className={cn(
              'pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xs py-3 pr-1 pl-4 text-sm font-medium',
              item.tone === 'error'
                ? 'bg-danger text-danger-fg'
                : 'bg-chrome text-chrome-fg ring-1 ring-border',
            )}
          >
            <Icon className="mt-0.5 size-5 shrink-0" />
            <p className="flex-1 py-0.5">{item.message}</p>
            <button
              type="button"
              aria-label="Cerrar aviso"
              onClick={() => dismissToast(item.id)}
              className="-my-2.5 flex size-11 shrink-0 items-center justify-center rounded-xs opacity-80 hover:opacity-100 focus-visible:outline-current"
            >
              <X className="size-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
