import { ImageOff } from 'lucide-react'
import { useContext, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import { resolveLessonImage } from '@/lib/lessonImages'
import { ImageLightbox } from './ImageLightbox'
import { LessonAssetsContext } from './lessonAssets'

interface LessonImageProps {
  src?: string
  alt?: string
}

/** Un diagrama de la lección: a todo el ancho, sobre blanco en los dos temas, y se toca para ampliar. */
export function LessonImage({ src = '', alt = '' }: LessonImageProps) {
  const url = resolveLessonImage(src, useContext(LessonAssetsContext))
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading')
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const wasOpen = useRef(false)

  // Después de cerrarla, el foco vuelve a la imagen que tocaste.
  useEffect(() => {
    if (wasOpen.current && !open) triggerRef.current?.focus()
    wasOpen.current = open
  }, [open])

  if (url === null || status === 'failed') {
    return (
      <span className="flex items-start gap-2 rounded-control border border-border px-3 py-3 text-sm text-fg-muted">
        <ImageOff className="mt-0.5 size-4 shrink-0" />
        No se pudo mostrar la imagen: {alt}
      </span>
    )
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Ampliar: ${alt}`}
        onClick={() => setOpen(true)}
        // min-h: mientras llega, la lección no se acorta (el «leída» se mide por su altura).
        className={cn(
          'block w-full cursor-zoom-in overflow-hidden rounded-control border border-border bg-diagram',
          status === 'loading' && 'min-h-64',
        )}
      >
        <img
          src={url}
          alt=""
          onLoad={() => setStatus('ready')}
          onError={() => setStatus('failed')}
          className="block w-full"
        />
      </button>
      {open && <ImageLightbox src={url} alt={alt} onClose={() => setOpen(false)} />}
    </>
  )
}
