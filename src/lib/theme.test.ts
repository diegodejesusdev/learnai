import { describe, expect, it } from 'vitest'
import { isThemePreference, resolveTheme } from './theme'

describe('tema', () => {
  it('«sistema» sigue la preferencia del sistema operativo', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
  })

  it('una elección manual ignora el sistema', () => {
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('dark', false)).toBe('dark')
  })

  it('valida lo leído de localStorage', () => {
    expect(isThemePreference('dark')).toBe(true)
    expect(isThemePreference('azul')).toBe(false)
    expect(isThemePreference(null)).toBe(false)
  })
})
