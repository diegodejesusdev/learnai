import { describe, expect, it } from 'vitest'
import { createEventDecoder, encodeEvent, parseEvent } from './tutorStream.ts'

describe('eventos NDJSON', () => {
  it('ida y vuelta', () => {
    const line = encodeEvent({ type: 'delta', text: 'Hola\n"mundo"' })
    expect(line.endsWith('\n')).toBe(true)
    expect(line.slice(0, -1)).not.toContain('\n')
    expect(parseEvent(line)).toEqual({ type: 'delta', text: 'Hola\n"mundo"' })
  })

  it('junta trozos partidos y separa varios eventos en un trozo', () => {
    const decoder = createEventDecoder()
    const text =
      encodeEvent({ type: 'start', conversationId: 'c1', userMessageId: 'u1' }) +
      encodeEvent({ type: 'delta', text: 'Un ' }) +
      encodeEvent({ type: 'delta', text: 'webhook' }) +
      encodeEvent({ type: 'done', messageId: 'm1', model: 'demo', remaining: 49 })
    const events = [text.slice(0, 7), text.slice(7, 60), text.slice(60)].flatMap((chunk) =>
      decoder.push(chunk),
    )
    expect(events.map((event) => event.type)).toEqual(['start', 'delta', 'delta', 'done'])
    expect(decoder.flush()).toEqual([])
  })

  it('ignora líneas inválidas y lee la última aunque no termine en salto de línea', () => {
    const decoder = createEventDecoder()
    expect(decoder.push('no es json\n{"type":"otro"}\n{"type":"delta","text":"x"}')).toEqual([])
    expect(decoder.flush()).toEqual([{ type: 'delta', text: 'x' }])
  })

  it('un error con código desconocido queda como unknown', () => {
    expect(parseEvent('{"type":"error","code":"raro","message":"Falló"}')).toEqual({
      type: 'error',
      code: 'unknown',
      message: 'Falló',
    })
  })
})
