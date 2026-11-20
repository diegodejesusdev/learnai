import { describe, expect, it } from 'vitest'
import { heatLegend, heatLevel, heatmapWeeks } from './heatmapModel'

const TODAY = '2026-11-20' // viernes

describe('heatmapWeeks', () => {
  const weeks = heatmapWeeks(
    [
      { day: '2026-11-18', minutes: 45, sessions: 2 },
      { day: '2026-11-20', minutes: 10, sessions: 1 },
    ],
    TODAY,
    6,
    15,
  )

  it('va de lunes a domingo desde hace 6 meses hasta la semana de hoy', () => {
    expect(weeks[0]?.weekStart).toBe('2026-05-18') // lunes de la semana del 20 de mayo
    expect(weeks.at(-1)?.weekStart).toBe('2026-11-16')
    expect(weeks).toHaveLength(27)
    expect(weeks.every((week) => week.cells.length === 7)).toBe(true)
  })

  it('marca los días que aún no llegan y pone los minutos de cada día', () => {
    const lastWeek = weeks.at(-1)?.cells ?? []
    expect(lastWeek.map((cell) => cell.future)).toEqual([
      false,
      false,
      false,
      false,
      false,
      true,
      true,
    ])
    expect(lastWeek[2]).toMatchObject({ day: '2026-11-18', minutes: 45, level: 2 })
    expect(lastWeek[4]).toMatchObject({ day: '2026-11-20', minutes: 10, level: 1 })
    expect(lastWeek[0]).toMatchObject({ minutes: 0, level: 0 })
  })

  it('pone el nombre del mes en la primera columna de cada mes', () => {
    const labels = weeks.filter((week) => week.monthLabel).map((week) => week.monthLabel)
    expect(labels).toEqual(['jun', 'jul', 'ago', 'sep', 'oct', 'nov'])
    // Mayo apenas asoma (2 columnas): su nombre se omite para no montarse sobre junio.
    expect(weeks[0]?.monthLabel).toBeNull()
  })
})

describe('niveles de color', () => {
  it('distingue los días que no llegan al mínimo de la racha', () => {
    expect(heatLevel(0, 15)).toBe(0)
    expect(heatLevel(14, 15)).toBe(1)
    expect(heatLevel(15, 15)).toBe(2)
    expect(heatLevel(60, 15)).toBe(3)
    expect(heatLevel(120, 15)).toBe(4)
  })

  it('con un mínimo alto, los niveles se corren y la leyenda omite los vacíos', () => {
    expect(heatLevel(70, 90)).toBe(1)
    expect(heatLevel(100, 90)).toBe(3)
    expect(heatLegend(90).map((item) => item.level)).toEqual([0, 1, 3, 4])
    expect(heatLegend(15).map((item) => item.label)).toEqual([
      'Sin estudio',
      'Menos de 15 min',
      '15 min a 59 min',
      '1 h a 1 h 59 min',
      '2 h o más',
    ])
  })
})
