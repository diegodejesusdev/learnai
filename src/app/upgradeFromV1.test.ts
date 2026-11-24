import { dehydrate, onlineManager, QueryClient } from '@tanstack/react-query'
import { persistQueryClientRestore } from '@tanstack/react-query-persist-client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { saveTopicStatus } from '@/features/ruta/progressApi'
import { topicStatusKey } from '@/features/ruta/useProgress'
import { roadmapKey } from '@/features/ruta/useRoadmap'
import { recordManualSession, type ManualSessionInput } from '@/features/temporizador/timerApi'
import { manualSessionKey } from '@/features/temporizador/useActiveTimer'
import { syncScope } from '@/lib/offline'
import { registerOfflineMutations } from './offlineMutations'
import { persistOptions } from './persistence'

// Lo que dejó en el dispositivo la versión de una sola ruta: los valores van escritos aquí a
// propósito (no importados), porque son los que ya están en el móvil y el PC de Diego.
const OLD_CACHE_KEY = 'learnai-cache'
const OLD_BUSTER = 'v1'

vi.mock('@/features/ruta/progressApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/ruta/progressApi')>()),
  saveTopicStatus: vi.fn(() => Promise.resolve()),
}))

const session: ManualSessionInput = {
  id: '0b9f3b1e-7a3c-4f39-9a51-0c1d2e3f4a5b',
  target: { topicId: 'f1-t5', projectPhaseId: null },
  startedAt: '2026-11-20T13:00:00.000Z',
  endedAt: '2026-11-20T13:30:00.000Z',
  durationMinutes: 30,
  notes: 'Sin conexión',
  markDone: false,
}

/** Copia guardada por la versión anterior: caché vieja y dos cambios que aún no se han subido. */
async function writeOldCache() {
  onlineManager.setOnline(false)
  const old = new QueryClient()
  registerOfflineMutations(old)
  old.setQueryData(['roadmap'], { title: 'Ruta', goal: 'Meta', phases: [], checklist: [] })
  old.setQueryData(['user-settings'], {
    weekly_goal_minutes: 480,
    pomodoro_work_min: 25,
    pomodoro_break_min: 5,
    streak_min_minutes: 15,
    theme: 'dark',
  })
  const queue = (mutationKey: readonly unknown[], variables: unknown) =>
    void old
      .getMutationCache()
      .build<unknown, Error, unknown, unknown>(old, { mutationKey, scope: syncScope })
      .execute(variables)
      .catch(() => undefined)
  queue(topicStatusKey, { topicId: 'f0-t2', status: 'hecho' })
  queue(manualSessionKey, session)
  await vi.waitFor(() =>
    expect(
      old
        .getMutationCache()
        .getAll()
        .map((item) => item.state.isPaused),
    ).toEqual([true, true]),
  )
  localStorage.setItem(
    OLD_CACHE_KEY,
    JSON.stringify({ buster: OLD_BUSTER, timestamp: Date.now(), clientState: dehydrate(old) }),
  )
}

afterEach(() => {
  onlineManager.setOnline(true)
  vi.clearAllMocks()
})

describe('actualizar desde la versión de una sola ruta', () => {
  it('los cambios en cola no se pierden y se suben una sola vez, en orden', async () => {
    await writeOldCache()
    const queryClient = new QueryClient()
    registerOfflineMutations(queryClient)
    await persistQueryClientRestore({ queryClient, ...persistOptions })
    expect(queryClient.getMutationCache().getAll()).toHaveLength(2)

    onlineManager.setOnline(true)
    await queryClient.resumePausedMutations()
    expect(saveTopicStatus).toHaveBeenCalledExactlyOnceWith('f0-t2', 'hecho')
    expect(recordManualSession).toHaveBeenCalledExactlyOnceWith(session)
  })

  it('no lee la ruta con la forma vieja: se vuelve a pedir', async () => {
    await writeOldCache()
    const queryClient = new QueryClient()
    registerOfflineMutations(queryClient)
    await persistQueryClientRestore({ queryClient, ...persistOptions })
    expect(queryClient.getQueryData(roadmapKey)).toBeUndefined()
  })
})
