import { describe, expect, it } from 'vitest'
import { saveStatus } from './saveStatus'

const base = {
  isWaiting: false,
  isPending: false,
  isPaused: false,
  isError: false,
  isSuccess: false,
}

describe('saveStatus', () => {
  it('sin cambios no muestra nada', () => {
    expect(saveStatus(base)).toBe('idle')
  })

  it('mientras espera el retardo o guarda → «Guardando…»', () => {
    expect(saveStatus({ ...base, isWaiting: true })).toBe('saving')
    expect(saveStatus({ ...base, isPending: true })).toBe('saving')
  })

  it('editar de nuevo después de guardar vuelve a «Guardando…»', () => {
    expect(saveStatus({ ...base, isSuccess: true, isWaiting: true })).toBe('saving')
  })

  it('sin conexión tiene prioridad', () => {
    expect(saveStatus({ ...base, isPending: true, isPaused: true })).toBe('offline')
  })

  it('error y guardado', () => {
    expect(saveStatus({ ...base, isError: true })).toBe('error')
    expect(saveStatus({ ...base, isSuccess: true })).toBe('saved')
  })
})
