import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// jsdom no implementa scrollTo (lo usa ScrollRestoration de React Router).
window.scrollTo = () => {}

// La AppShell consulta el temporizador activo y los ajustes en todas las pantallas.
// Por defecto: sin temporizador y con los ajustes por defecto, sin tocar la red.
// Cada test puede cambiarlo con vi.mocked(fetchActiveTimer).mockResolvedValue(...).
vi.mock('@/features/temporizador/timerApi', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/features/temporizador/timerApi')>()
  return {
    ...original,
    fetchActiveTimer: vi.fn(() => Promise.resolve(null)),
    insertActiveTimer: vi.fn(() => Promise.resolve()),
    updateActiveTimer: vi.fn(() => Promise.resolve()),
    upsertActiveTimer: vi.fn(() => Promise.resolve()),
    deleteActiveTimer: vi.fn(() => Promise.resolve()),
    finishActiveTimer: vi.fn(() => Promise.resolve('sesion-1')),
    recordManualSession: vi.fn(() => Promise.resolve('sesion-2')),
    fetchMinutesSince: vi.fn(() => Promise.resolve(0)),
  }
})
vi.mock('@/features/ajustes/settingsApi', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/features/ajustes/settingsApi')>()
  return {
    ...original,
    fetchUserSettings: vi.fn(() => Promise.resolve(original.defaultSettings)),
    saveUserSettings: vi.fn(() => Promise.resolve()),
  }
})

afterEach(() => {
  cleanup()
  localStorage.clear()
})
