import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// jsdom no implementa scrollTo (lo usa ScrollRestoration de React Router) ni scrollIntoView
// (lo usa el chat del tutor).
window.scrollTo = () => {}
Element.prototype.scrollIntoView = () => {}

// Ni ResizeObserver (lo usa ResponsiveContainer de Recharts).
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

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

// Inicio y el Historial piden totales y sesiones: por defecto, sin ninguna sesión.
vi.mock('@/features/historial/historyApi', () => ({
  fetchDayTotals: vi.fn(() => Promise.resolve([])),
  fetchWeekTotals: vi.fn(() => Promise.resolve([])),
  fetchPhaseTotals: vi.fn(() => Promise.resolve([])),
}))
vi.mock('@/features/historial/sessionsApi', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/features/historial/sessionsApi')>()
  return {
    ...original,
    fetchSessionPage: vi.fn(() => Promise.resolve([])),
    fetchSession: vi.fn(() => Promise.resolve(null)),
    fetchLatestSession: vi.fn(() => Promise.resolve(null)),
    fetchAllSessions: vi.fn(() => Promise.resolve([])),
    updateSession: vi.fn(() => Promise.resolve()),
    deleteSession: vi.fn(() => Promise.resolve()),
  }
})

// Las páginas de un tema, de una fase y del Tutor preguntan si hay lección: por defecto, ninguna.
vi.mock('@/features/leccion/lessonApi', () => ({
  fetchLessonIndex: vi.fn(() => Promise.resolve({})),
  fetchLesson: vi.fn(() => Promise.resolve(null)),
  fetchLessons: vi.fn(() => Promise.resolve([])),
  fetchLessonProgress: vi.fn(() => Promise.resolve({})),
  saveLessonProgress: vi.fn(() => Promise.resolve()),
}))

afterEach(() => {
  cleanup()
  localStorage.clear()
})
