import { describe, expect, it } from 'vitest'
import { nextSyncState, type SyncState } from './syncState'

/** Aplica una serie de momentos y devuelve el estado tras cada uno. */
function run(steps: [boolean, number, number][], start: SyncState = 'idle'): SyncState[] {
  let state = start
  return steps.map(
    ([online, paused, pending]) => (state = nextSyncState(state, { online, paused, pending })),
  )
}

describe('indicador de conexión', () => {
  it('sin conexión, con o sin cambios en cola', () => {
    expect(run([[false, 0, 0]])).toEqual(['offline'])
    expect(run([[false, 2, 2]])).toEqual(['offline'])
  })

  it('al volver con cambios en cola: sincronizando y luego sincronizado', () => {
    expect(
      run([
        [false, 2, 2],
        [true, 2, 2], // aún en pausa un instante
        [true, 0, 1], // subiendo
        [true, 0, 0], // listo
      ]),
    ).toEqual(['offline', 'syncing', 'syncing', 'synced'])
  })

  it('al volver sin cambios pendientes no muestra nada', () => {
    expect(
      run([
        [false, 0, 0],
        [true, 0, 0],
      ]),
    ).toEqual(['offline', 'idle'])
  })

  it('un guardado normal con conexión no muestra «sincronizando»', () => {
    expect(
      run([
        [true, 0, 1],
        [true, 0, 0],
      ]),
    ).toEqual(['idle', 'idle'])
  })
})
