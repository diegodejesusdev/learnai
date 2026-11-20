import { describe, expect, it } from 'vitest'
import { installHelp } from './installPrompt'

const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1'
const IPAD_AS_MAC =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15'
const ANDROID_CHROME =
  'Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Mobile Safari/537.36'

const base = { standalone: false, canInstall: false, maxTouchPoints: 0 }

describe('instalar la app', () => {
  it('si ya está instalada, lo dice', () => {
    expect(installHelp({ ...base, standalone: true, userAgent: IPHONE })).toBe('installed')
  })

  it('con Chrome o Edge que lo permiten, muestra el botón', () => {
    expect(installHelp({ ...base, canInstall: true, userAgent: ANDROID_CHROME })).toBe('prompt')
  })

  it('en iPhone y iPad da los pasos de Compartir → Agregar a inicio', () => {
    expect(installHelp({ ...base, userAgent: IPHONE, maxTouchPoints: 5 })).toBe('ios')
    expect(installHelp({ ...base, userAgent: IPAD_AS_MAC, maxTouchPoints: 5 })).toBe('ios')
  })

  it('un Mac de escritorio sin el evento no es un iPad', () => {
    expect(installHelp({ ...base, userAgent: IPAD_AS_MAC, maxTouchPoints: 0 })).toBe('unsupported')
  })
})
