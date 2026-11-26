import { X, ZoomIn, ZoomOut } from 'lucide-react'
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/Button'
import { buttonClasses } from '@/components/ui/styles'
import { cn } from '@/lib/cn'

interface ImageLightboxProps {
  src: string
  alt: string
  onClose: () => void
}

/**
 * La imagen a pantalla completa. «Acercar» (o tocar la imagen) la agranda y se recorre con el dedo;
 * en el móvil además se puede pellizcar. Escape y «Cerrar» la cierran y el foco vuelve a la imagen.
 */
export function ImageLightbox({ src, alt, onClose }: ImageLightboxProps) {
  const [zoomed, setZoomed] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    closeRef.current?.focus()
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = overflow
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  /** El Tab da la vuelta entre los dos botones, sin salir a la página de atrás. */
  function trapTab(event: KeyboardEvent) {
    if (event.key !== 'Tab') return
    const buttons = [...(dialogRef.current?.querySelectorAll('button') ?? [])]
    const first = buttons[0]
    const last = buttons.at(-1)
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last?.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first?.focus()
    }
  }

  const ZoomIcon = zoomed ? ZoomOut : ZoomIn
  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Imagen ampliada"
      data-surface="dark"
      onKeyDown={trapTab}
      className="fixed inset-0 z-50 flex flex-col bg-chrome pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex items-center justify-end gap-2 p-2">
        <Button variant="outline" onClick={() => setZoomed(!zoomed)}>
          <ZoomIcon className="size-4" />
          {zoomed ? 'Alejar' : 'Acercar'}
        </Button>
        <button ref={closeRef} type="button" onClick={onClose} className={buttonClasses('inverse')}>
          <X className="size-4" />
          Cerrar
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-2 sm:p-4">
        <div
          data-testid="lightbox-image"
          className={cn(
            'rounded-control bg-diagram',
            zoomed ? 'w-[220%] max-w-none' : 'mx-auto w-full max-w-4xl',
          )}
        >
          <img
            src={src}
            alt={alt}
            onClick={() => setZoomed(!zoomed)}
            className={cn('block w-full', zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in')}
          />
        </div>
      </div>
    </div>,
    document.body,
  )
}
