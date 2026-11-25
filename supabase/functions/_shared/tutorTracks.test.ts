import { describe, expect, it } from 'vitest'
import { trackProfile } from './tutorTracks.ts'

const track = (id: string) => ({ id, title: `Ruta ${id}`, goal: `Meta de ${id}` })

describe('perfil del tutor por ruta', () => {
  it('automatización: pequeños negocios colombianos', () => {
    const profile = trackProfile(track('automatizacion'))
    expect(profile.role).toContain('automatización para pequeños negocios en Colombia')
    expect(profile.examples).toContain('tienda de barrio')
  })

  it('ingeniería de datos: datos de Colombia, SQL y Python', () => {
    const profile = trackProfile(track('ingenieria-datos'))
    expect(profile.role).toContain('ingeniería de datos')
    expect(profile.examples).toMatch(/datos abiertos/)
    expect(profile.examples).toMatch(/SQL/)
    expect(JSON.stringify(profile)).not.toMatch(/tienda de barrio|n8n|panadería/)
  })

  it('cloud: AWS primero, con equivalencias, costos y recursos por borrar', () => {
    const profile = trackProfile(track('cloud'))
    expect(profile.role).toContain('AWS')
    expect(profile.examples).toContain('AWS como nube principal')
    expect(profile.examples).toMatch(/Azure y Google Cloud/)
    expect(profile.always).toMatch(/costos/)
    expect(profile.always).toMatch(/borrar/)
    expect(profile.risks).toMatch(/recursos sin borrar/)
    expect(JSON.stringify(profile)).not.toMatch(/tienda de barrio|n8n|panadería|dbt/)
  })

  it('una ruta nueva usa un perfil genérico con su título y su meta', () => {
    const profile = trackProfile({ id: 'diseno', title: 'Diseño web', goal: 'Hacer un portafolio' })
    expect(profile.role).toContain('«Diseño web»')
    expect(profile.role).toContain('Hacer un portafolio')
    expect(JSON.stringify(profile)).not.toMatch(/tienda de barrio|ingeniería de datos|AWS/)
  })
})
