import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { dismissToast, getToasts, subscribeToToasts, toast } from './toast'

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  for (const item of getToasts()) dismissToast(item.id)
  vi.useRealTimers()
})

describe('toast', () => {
  it('muestra un aviso y avisa a los suscriptores', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeToToasts(listener)
    toast.error('No se pudo guardar')
    expect(getToasts()).toMatchObject([{ tone: 'error', message: 'No se pudo guardar' }])
    expect(listener).toHaveBeenCalled()
    unsubscribe()
  })

  it('no repite un aviso que ya está en pantalla', () => {
    toast.error('Sin conexión')
    toast.error('Sin conexión')
    expect(getToasts()).toHaveLength(1)
  })

  it('desaparece solo a los 5 s o al cerrarlo', () => {
    toast.success('Guardado')
    vi.advanceTimersByTime(4999)
    expect(getToasts()).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(getToasts()).toHaveLength(0)

    toast.error('Otro')
    const [item] = getToasts()
    if (item) dismissToast(item.id)
    expect(getToasts()).toHaveLength(0)
  })
})
