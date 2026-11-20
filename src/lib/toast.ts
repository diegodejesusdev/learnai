// Avisos breves («toasts») que se pueden lanzar desde cualquier lugar, incluso fuera de React
// (por ejemplo, en el onError de una mutación). <Toaster /> los muestra.

export type ToastTone = 'error' | 'success'

export interface ToastItem {
  id: number
  tone: ToastTone
  message: string
}

const DURATION_MS = 5000

let items: readonly ToastItem[] = []
let nextId = 1
const listeners = new Set<() => void>()

function emit(next: readonly ToastItem[]) {
  items = next
  for (const listener of listeners) listener()
}

function show(tone: ToastTone, message: string): void {
  // Si el mismo aviso ya está en pantalla, no se repite.
  if (items.some((item) => item.message === message)) return
  const id = nextId++
  emit([...items, { id, tone, message }])
  setTimeout(() => dismissToast(id), DURATION_MS)
}

export function dismissToast(id: number): void {
  if (items.some((item) => item.id === id)) emit(items.filter((item) => item.id !== id))
}

export const toast = {
  error: (message: string) => show('error', message),
  success: (message: string) => show('success', message),
}

export function subscribeToToasts(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getToasts(): readonly ToastItem[] {
  return items
}
