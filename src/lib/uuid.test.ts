import { afterEach, describe, expect, it, vi } from 'vitest'
import { newId } from './uuid'

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

afterEach(() => vi.unstubAllGlobals())

describe('newId', () => {
  it('genera UUID v4 distintos', () => {
    const ids = new Set(Array.from({ length: 50 }, newId))
    expect(ids.size).toBe(50)
    for (const id of ids) expect(id).toMatch(UUID_V4)
  })

  it('funciona sin crypto.randomUUID (http por la IP de la Wi-Fi)', () => {
    vi.stubGlobal('crypto', { getRandomValues: crypto.getRandomValues.bind(crypto) })
    expect(newId()).toMatch(UUID_V4)
  })
})
