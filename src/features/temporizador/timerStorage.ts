import type { ActiveTimer } from './timerModel'

// Copia local del temporizador: aparece al instante al abrir la app y funciona sin conexión.
// La fuente de verdad compartida entre dispositivos es la tabla active_timer de Supabase.

const STORAGE_KEY = 'learnai-active-timer'

export interface StoredTimer {
  userId: string
  timer: ActiveTimer | null
  /** false = cambio hecho en este dispositivo que aún no llegó a Supabase. */
  synced: boolean
  changedAt: string
}

function isStoredTimer(value: unknown): value is StoredTimer {
  if (typeof value !== 'object' || value === null) return false
  const entry = value as Record<string, unknown>
  return (
    typeof entry.userId === 'string' &&
    typeof entry.synced === 'boolean' &&
    typeof entry.changedAt === 'string' &&
    (entry.timer === null || (typeof entry.timer === 'object' && entry.timer !== null))
  )
}

export function readStoredTimer(userId: string): StoredTimer | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : null
    // Si es de otra cuenta, se ignora.
    return isStoredTimer(parsed) && parsed.userId === userId ? parsed : null
  } catch {
    return null
  }
}

export function writeStoredTimer(entry: StoredTimer): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entry))
  } catch {
    // Sin almacenamiento (modo privado): queda solo en Supabase.
  }
}

export function clearStoredTimer(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // nada que hacer
  }
}

export interface Reconciled {
  timer: ActiveTimer | null
  /** La copia local es más nueva y hay que subirla a Supabase. */
  push: boolean
}

/**
 * Decide qué temporizador vale al abrir la app:
 * - Si la copia local tiene cambios sin subir (p. ej. pausaste sin conexión) y son más
 *   nuevos que lo de Supabase, gana la copia local y se sube.
 * - En cualquier otro caso gana Supabase (incluido «ya no hay temporizador» porque
 *   terminaste la sesión en otro dispositivo).
 */
export function reconcileTimer(server: ActiveTimer | null, local: StoredTimer | null): Reconciled {
  if (local && !local.synced) {
    const serverTime = server ? new Date(server.updatedAt).getTime() : -Infinity
    if (new Date(local.changedAt).getTime() >= serverTime) return { timer: local.timer, push: true }
  }
  return { timer: server, push: false }
}
