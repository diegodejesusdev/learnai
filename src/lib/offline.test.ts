import { describe, expect, it } from 'vitest'
import { isNetworkError } from './offline'

describe('isNetworkError', () => {
  it('reconoce los fallos de red de cada navegador', () => {
    expect(isNetworkError(new TypeError('Failed to fetch'))).toBe(true)
    expect(isNetworkError({ message: 'TypeError: Failed to fetch', code: '' })).toBe(true)
    expect(isNetworkError({ message: 'NetworkError when attempting to fetch resource.' })).toBe(
      true,
    )
    expect(isNetworkError({ message: 'Load failed' })).toBe(true)
  })

  it('no confunde un error del servidor con uno de red', () => {
    expect(
      isNetworkError({ message: 'new row violates row-level security policy', code: '42501' }),
    ).toBe(false)
    expect(isNetworkError(new Error('Algo falló'))).toBe(false)
    expect(isNetworkError(null)).toBe(false)
  })
})
