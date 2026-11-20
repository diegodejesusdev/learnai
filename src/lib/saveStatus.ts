export type SaveStatus = 'idle' | 'saving' | 'offline' | 'saved' | 'error'

interface SaveState {
  /** Hay cambios esperando el retardo del autoguardado. */
  isWaiting: boolean
  isPending: boolean
  /** TanStack Query pausa la mutación si no hay conexión y la reintenta al volver. */
  isPaused: boolean
  isError: boolean
  isSuccess: boolean
}

export function saveStatus(state: SaveState): SaveStatus {
  if (state.isPaused) return 'offline'
  if (state.isWaiting || state.isPending) return 'saving'
  if (state.isError) return 'error'
  if (state.isSuccess) return 'saved'
  return 'idle'
}
