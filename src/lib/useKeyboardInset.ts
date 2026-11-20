import { useEffect } from 'react'

// Teclado del móvil abierto: <html data-keyboard="open"> y --keyboard-inset con su alto.
// Con eso el CSS oculta la barra de navegación y sube la caja de texto del chat.
//  - iOS: el teclado tapa la página sin achicarla; el alto sale de visualViewport.
//  - Android (con interactive-widget=resizes-content en index.html): la página se achica
//    y el alto del teclado ya no hay que restarlo; se detecta por la altura perdida.
const OPEN_THRESHOLD = 120

function isEditing(): boolean {
  const element = document.activeElement
  return element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement
}

export function useKeyboardInset(): void {
  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return
    const root = document.documentElement
    let fullHeight = window.innerHeight

    const update = () => {
      if (!isEditing()) fullHeight = Math.max(fullHeight, window.innerHeight)
      const covered = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)
      const shrunk = fullHeight - window.innerHeight
      const open = isEditing() && (covered > OPEN_THRESHOLD || shrunk > OPEN_THRESHOLD)
      root.style.setProperty('--keyboard-inset', `${open ? covered : 0}px`)
      if (open) root.dataset.keyboard = 'open'
      else delete root.dataset.keyboard
    }

    viewport.addEventListener('resize', update)
    viewport.addEventListener('scroll', update)
    document.addEventListener('focusin', update)
    document.addEventListener('focusout', update)
    return () => {
      viewport.removeEventListener('resize', update)
      viewport.removeEventListener('scroll', update)
      document.removeEventListener('focusin', update)
      document.removeEventListener('focusout', update)
      root.style.removeProperty('--keyboard-inset')
      delete root.dataset.keyboard
    }
  }, [])
}
