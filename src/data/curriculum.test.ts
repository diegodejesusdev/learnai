import { describe, expect, it } from 'vitest'
import { automationTrack, dataTrack, phases, tracks } from './curriculum'

const topicIds = (track: typeof automationTrack) =>
  track.phases.flatMap((phase) => phase.topics.map((topic) => topic.id))

describe('rutas en src/data/routes', () => {
  it('automatización primero e ingeniería de datos después', () => {
    expect(tracks.map((track) => [track.id, track.title])).toEqual([
      ['automatizacion', 'Automatización para negocios'],
      ['ingenieria-datos', 'Ingeniería de datos'],
    ])
  })

  it('automatización: 9 fases en orden, 100 temas y 14 ítems', () => {
    expect(phases.map((phase) => phase.id)).toEqual([
      'f0',
      'f1',
      'f2',
      'f3',
      'f4',
      'f5',
      'f6',
      'f7',
      'f8',
    ])
    expect(topicIds(automationTrack)).toHaveLength(100)
    expect(automationTrack.checklist).toHaveLength(14)
  })

  it('los ids de automatización son exactamente los de siempre: el progreso está ligado a ellos', () => {
    const topicsPerPhase = [8, 11, 15, 12, 15, 12, 14, 7, 6]
    expect(topicIds(automationTrack)).toEqual(
      topicsPerPhase.flatMap((count, phase) =>
        Array.from({ length: count }, (_, index) => `f${phase}-t${index + 1}`),
      ),
    )
    expect(automationTrack.checklist.map((item) => item.id)).toEqual(
      Array.from({ length: 14 }, (_, index) => `c${index + 1}`),
    )
  })

  it('ingeniería de datos: 13 fases, 110 temas y 15 ítems, todos con ids «de-»', () => {
    expect(dataTrack.phases).toHaveLength(13)
    expect(topicIds(dataTrack)).toHaveLength(110)
    expect(dataTrack.checklist).toHaveLength(15)
    const ids = [
      ...dataTrack.phases.map((phase) => phase.id),
      ...topicIds(dataTrack),
      ...dataTrack.checklist.map((item) => item.id),
    ]
    expect(ids.filter((id) => !id.startsWith('de-'))).toEqual([])
  })

  it('los ids de temas empiezan por el id de su fase', () => {
    for (const phase of tracks.flatMap((track) => track.phases)) {
      for (const topic of phase.topics) expect(topic.id.startsWith(`${phase.id}-`)).toBe(true)
    }
  })
})
