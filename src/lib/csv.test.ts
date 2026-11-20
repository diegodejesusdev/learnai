import { describe, expect, it } from 'vitest'
import { toCsv } from './csv'

describe('toCsv', () => {
  it('empieza con BOM y separa filas con CRLF', () => {
    expect(
      toCsv([
        ['a', 'b'],
        [1, 2],
      ]),
    ).toBe('\uFEFFa,b\r\n1,2\r\n')
  })

  it('pone entre comillas las celdas con comas, comillas o saltos de línea', () => {
    expect(toCsv([['Hola, mundo', 'Dijo "listo"', 'línea 1\nlínea 2', 'sin nada']])).toBe(
      '\uFEFF"Hola, mundo","Dijo ""listo""","línea 1\nlínea 2",sin nada\r\n',
    )
  })

  it('deja las tildes y la ñ tal cual (UTF-8)', () => {
    expect(toCsv([['Automatización', 'Diseño', 'añadir']])).toBe(
      '\uFEFFAutomatización,Diseño,añadir\r\n',
    )
  })

  it('una celda vacía queda vacía', () => {
    expect(toCsv([['', 'x']])).toBe('\uFEFF,x\r\n')
  })
})
