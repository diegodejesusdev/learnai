import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// Se lee del disco: Vitest entrega vacíos los .css importados.
const css = readFileSync('src/styles/index.css', 'utf8')

type Tokens = Record<string, string>

function tokensOf(selector: string): Tokens {
  const block = new RegExp(`^${selector} \\{([^}]*)\\}`, 'm').exec(css)?.[1] ?? ''
  const tokens: Tokens = {}
  for (const [, name = '', hex = ''] of block.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6});/gi)) {
    tokens[name] = hex
  }
  return tokens
}

function luminance(hex: string): number {
  const [r = 0, g = 0, b = 0] = [1, 3, 5].map((index) => {
    const channel = parseInt(hex.slice(index, index + 2), 16) / 255
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return ((light ?? 0) + 0.05) / ((dark ?? 0) + 0.05)
}

// Texto sobre fondo. El secundario exige 7:1 sobre el fondo de página: es lo que más se lee.
const textPairs: readonly [text: string, background: string, min: number][] = [
  ['fg', 'bg', 12],
  ['fg', 'surface-muted', 7],
  ['fg-muted', 'bg', 7],
  ['fg-muted', 'surface', 7],
  ['fg-muted', 'surface-muted', 4.5],
  ['accent', 'bg', 4.5],
  ['accent', 'surface', 4.5],
  ['accent', 'surface-muted', 4.5],
  ['accent-soft-fg', 'accent-soft', 4.5],
  ['hero-fg', 'hero', 7],
  ['hero-muted', 'hero', 4.5],
  ['chrome-fg', 'chrome', 7],
  ['chrome-muted', 'chrome', 4.5],
  ['chrome-fg', 'chrome-hover', 7],
  ['action-fg', 'action', 7],
  ['action-fg', 'action-hover', 7],
  ['done-fg', 'done', 7],
  ['danger', 'bg', 4.5],
  ['danger', 'surface', 4.5],
  // El código de las lecciones va sobre surface.
  ['code-keyword', 'surface', 4.5],
  ['code-string', 'surface', 4.5],
  ['code-value', 'surface', 4.5],
  ['code-comment', 'surface', 4.5],
  ['danger-fg', 'danger', 4.5],
]

// Bordes de controles, barras y marcas: 3:1 (WCAG 1.4.11).
const graphicPairs: readonly [mark: string, background: string][] = [
  ['control', 'bg'],
  ['control', 'surface'],
  ['meter', 'track'],
  ['meter', 'bg'],
  ['meter', 'surface'],
  ['heat-3', 'surface'],
  ['heat-4', 'surface'],
]

describe.each([
  ['claro', tokensOf(':root')],
  ['oscuro', tokensOf("\\[data-theme='dark'\\]")],
])('contraste del tema %s', (_theme, tokens) => {
  it.each(textPairs)('%s sobre %s llega a %d:1', (text, background, min) => {
    expect(contrast(tokens[text] ?? '', tokens[background] ?? '')).toBeGreaterThanOrEqual(min)
  })

  it.each(graphicPairs)('%s se distingue de %s', (mark, background) => {
    expect(contrast(tokens[mark] ?? '', tokens[background] ?? '')).toBeGreaterThanOrEqual(3)
  })

  it('el mapa de calor sube paso a paso, sin saltos invisibles', () => {
    const steps = [0, 1, 2, 3].map((level) =>
      contrast(tokens[`heat-${level}`] ?? '', tokens[`heat-${level + 1}`] ?? ''),
    )
    expect(Math.min(...steps)).toBeGreaterThanOrEqual(1.4)
  })

  it('error y acento no se confunden: distinto color', () => {
    expect(tokens['danger']).not.toBe(tokens['accent'])
  })
})
