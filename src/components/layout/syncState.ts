export type SyncState = 'offline' | 'syncing' | 'synced' | 'idle'

export interface SyncSnapshot {
  online: boolean
  /** Cambios en la cola, esperando conexión. */
  paused: number
  /** Cambios enviándose ahora (incluidos los que salieron de la cola). */
  pending: number
}

/**
 * Qué mostrar arriba: «Sin conexión», «Sincronizando…» o «Sincronizado».
 * Solo se habla de sincronizar cuando había cambios en la cola: un guardado normal con conexión
 * no muestra nada. «Sincronizado» se oculta solo al rato (lo decide el componente).
 */
export function nextSyncState(previous: SyncState, snapshot: SyncSnapshot): SyncState {
  if (!snapshot.online) return 'offline'
  if (snapshot.paused > 0) return 'syncing'
  if (previous === 'offline' || previous === 'syncing') {
    if (snapshot.pending > 0) return 'syncing'
    return previous === 'syncing' ? 'synced' : 'idle'
  }
  return previous
}
