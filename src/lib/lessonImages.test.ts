import { describe, expect, it } from 'vitest'
import {
  lessonAssetBase,
  lessonImageSources,
  lessonImageUrls,
  localImagePath,
  resolveLessonImage,
} from './lessonImages'

const BASE = lessonAssetBase('cloud', 'cl-f0')

describe('rutas de las imágenes', () => {
  it('cada fase tiene su carpeta en el build', () => {
    expect(BASE).toBe('/lessons/cloud/cl-f0/')
  })

  it('la ruta relativa del Markdown se reescribe a la del build', () => {
    expect(resolveLessonImage('img/cl-f0-t1-capacidad.svg', BASE)).toBe(
      '/lessons/cloud/cl-f0/img/cl-f0-t1-capacidad.svg',
    )
    expect(resolveLessonImage('./img/a.png', BASE)).toBe('/lessons/cloud/cl-f0/img/a.png')
  })

  it('solo se admiten imágenes de la carpeta img/ de la propia fase', () => {
    for (const src of [
      'https://sitio.com/a.svg',
      '//sitio.com/a.svg',
      '/lessons/cloud/cl-f1/img/a.svg',
      '../cl-f1/img/a.svg',
      'img/../../a.svg',
      'img/sub/a.svg',
      'img/a.exe',
      'a.svg',
      'javascript:alert(1)',
      '',
    ]) {
      expect(localImagePath(src), src).toBeNull()
      expect(resolveLessonImage(src, BASE), src).toBeNull()
    }
  })
})

describe('imágenes que usa una lección', () => {
  const markdown = [
    '## Explicación',
    '',
    '![Un diagrama (con paréntesis)](img/uno.svg)',
    '',
    '*Pie.*',
    '',
    '![Otro](img/dos.svg "con título")',
    '',
    '```markdown',
    '![no cuenta, es un ejemplo de código](img/ejemplo.svg)',
    '```',
    '',
    '![Repetida](img/uno.svg) y un [enlace](img/no-es-imagen.svg)',
    '',
    '![Externa](https://sitio.com/x.svg)',
  ].join('\n')

  it('lista cada una una vez, sin las de bloques de código', () => {
    expect(lessonImageSources(markdown)).toEqual([
      'img/uno.svg',
      'img/dos.svg',
      'https://sitio.com/x.svg',
    ])
  })

  it('las direcciones del build, para guardarlas con la lección', () => {
    expect(lessonImageUrls(markdown, BASE)).toEqual([
      '/lessons/cloud/cl-f0/img/uno.svg',
      '/lessons/cloud/cl-f0/img/dos.svg',
    ])
  })

  it('una lección sin imágenes no tiene ninguna', () => {
    expect(lessonImageSources('## Objetivo\n\nHola')).toEqual([])
  })
})
