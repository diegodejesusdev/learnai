import { describe, expect, it } from 'vitest'
import { normalizeUrl, urlError } from './projectForm'

describe('enlaces del proyecto', () => {
  it('vacío es válido y se guarda como null', () => {
    expect(normalizeUrl('   ')).toBeNull()
    expect(urlError('')).toBeNull()
  })

  it('acepta http y https completos', () => {
    expect(urlError('https://github.com/diego/n8n-flujos')).toBeNull()
    expect(urlError(' http://mi-demo.vercel.app ')).toBeNull()
    expect(normalizeUrl(' https://a.co ')).toBe('https://a.co')
  })

  it('rechaza enlaces sin protocolo o que no son URL', () => {
    expect(urlError('github.com/diego')).toBe('Escribe el enlace completo, empezando por https://')
    expect(urlError('ftp://servidor')).not.toBeNull()
    expect(urlError('https://')).not.toBeNull()
  })
})
