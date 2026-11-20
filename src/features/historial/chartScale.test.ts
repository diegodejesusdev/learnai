import { describe, expect, it } from 'vitest'
import { hourTicks } from './chartScale'

describe('hourTicks', () => {
  it('cubre la meta de 10 h con marcas cada 2 h', () => {
    expect(hourTicks(600)).toEqual([0, 120, 240, 360, 480, 600])
  })

  it('si una semana pasa la meta, el eje crece con pasos redondos', () => {
    expect(hourTicks(605)).toEqual([0, 300, 600, 900])
  })

  it('con poco tiempo, marcas cada hora y al menos 1 h', () => {
    expect(hourTicks(0)).toEqual([0, 60])
    expect(hourTicks(150)).toEqual([0, 60, 120, 180])
  })
})
