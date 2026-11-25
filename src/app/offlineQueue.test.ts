import {
  dehydrate,
  hydrate,
  onlineManager,
  QueryClient,
  type DehydratedState,
} from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { saveLessonProgress } from '@/features/leccion/lessonApi'
import { saveLessonKey } from '@/features/leccion/lessonKeys'
import { recordManualSession, type ManualSessionInput } from '@/features/temporizador/timerApi'
import { manualSessionKey } from '@/features/temporizador/useActiveTimer'
import { registerOfflineMutations } from './offlineMutations'

const input: ManualSessionInput = {
  id: '0b9f3b1e-7a3c-4f39-9a51-0c1d2e3f4a5b',
  target: { topicId: 'f1-t5', projectPhaseId: null },
  startedAt: '2026-11-20T13:00:00.000Z',
  endedAt: '2026-11-20T13:30:00.000Z',
  durationMinutes: 30,
  notes: 'Sin conexión',
  markDone: false,
}

afterEach(() => {
  onlineManager.setOnline(true)
  vi.clearAllMocks()
})

describe('cola sin conexión', () => {
  it('sobrevive a cerrar la app y, al reanudarla, la sesión se envía una sola vez', async () => {
    // Sin conexión: la sesión queda en pausa en la cola.
    onlineManager.setOnline(false)
    const before = new QueryClient()
    registerOfflineMutations(before)
    void before
      .getMutationCache()
      .build(before, { mutationKey: manualSessionKey })
      .execute(input)
      .catch(() => undefined)
    await vi.waitFor(() => expect(before.getMutationCache().getAll()[0]?.state.isPaused).toBe(true))
    expect(recordManualSession).not.toHaveBeenCalled()

    // Lo que se guarda en el dispositivo (JSON) y se recupera al abrir la app otra vez.
    const saved = JSON.parse(JSON.stringify(dehydrate(before))) as DehydratedState
    const after = new QueryClient()
    registerOfflineMutations(after)
    hydrate(after, saved)

    onlineManager.setOnline(true)
    await after.resumePausedMutations()
    expect(recordManualSession).toHaveBeenCalledTimes(1)
    expect(recordManualSession).toHaveBeenCalledWith(input)

    // Reanudar de nuevo no la repite (y si llegara dos veces, la base la ignora por su id).
    await after.resumePausedMutations()
    expect(recordManualSession).toHaveBeenCalledTimes(1)
  })

  it('una lección leída sin conexión se marca al volver, aunque cierres la app', async () => {
    onlineManager.setOnline(false)
    const before = new QueryClient()
    registerOfflineMutations(before)
    const read = { topicId: 'cl-f0-t1', scrollPct: 100, readAt: '2026-11-24T15:00:00.000Z' }
    void before
      .getMutationCache()
      .build(before, { mutationKey: saveLessonKey })
      .execute(read)
      .catch(() => undefined)
    await vi.waitFor(() => expect(before.getMutationCache().getAll()[0]?.state.isPaused).toBe(true))

    const saved = JSON.parse(JSON.stringify(dehydrate(before))) as DehydratedState
    const after = new QueryClient()
    registerOfflineMutations(after)
    hydrate(after, saved)

    onlineManager.setOnline(true)
    await after.resumePausedMutations()
    expect(saveLessonProgress).toHaveBeenCalledExactlyOnceWith(read)
  })
})
