import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { readFile } from 'node:fs/promises'
import { CONTENT_DIR } from './lessonFiles.ts'
import { contentFileForUrl, imageContentType, listLessonImages } from './lessonImages.ts'

describe('imágenes de las lecciones', () => {
  let dir: string
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'learnai-img-'))
  })
  afterEach(() => rm(dir, { recursive: true }))

  async function write(path: string, text = '<svg/>') {
    await mkdir(dirname(join(dir, path)), { recursive: true })
    await writeFile(join(dir, path), text)
  }

  it('lista las de content/<ruta>/<fase>/img/ con su dirección en el build', async () => {
    await write('cloud/cl-f0/img/a.svg')
    await write('cloud/cl-f1/img/b.png')
    await write('cloud/cl-f0/cl-f0-t1.md', '# no es imagen')
    await write('cloud/cl-f0/img/.DS_Store', 'basura')
    await write('cloud/cl-f0/img/notas.txt', 'no es imagen')
    const images = await listLessonImages(dir)
    expect(images.map(({ url }) => url)).toEqual([
      'lessons/cloud/cl-f0/img/a.svg',
      'lessons/cloud/cl-f1/img/b.png',
    ])
    expect(images[0]?.source).toBe(join(dir, 'cloud/cl-f0/img/a.svg'))
  })

  it('sin carpeta de contenido, no hay imágenes', async () => {
    expect(await listLessonImages(join(dir, 'no-existe'))).toEqual([])
  })

  it('en desarrollo, una dirección del build apunta a su archivo y a ningún otro', () => {
    expect(contentFileForUrl(dir, '/lessons/cloud/cl-f0/img/a.svg')).toBe(
      join(dir, 'cloud/cl-f0/img/a.svg'),
    )
    for (const url of [
      '/lessons/cloud/cl-f0/cl-f0-t1.md',
      '/lessons/cloud/cl-f0/img/../cl-f0-t1.md',
      '/lessons/../package.json',
      '/lessons/cloud/img/a.svg',
      '/lessons/cloud/cl-f0/img/%2e%2e/x.svg',
      '/otra/cloud/cl-f0/img/a.svg',
    ]) {
      expect(contentFileForUrl(dir, url), url).toBeNull()
    }
  })

  it('cada tipo se sirve con el suyo', () => {
    expect(imageContentType('a.svg')).toBe('image/svg+xml')
    expect(imageContentType('a.PNG')).toBe('image/png')
    expect(imageContentType('a.jpg')).toBe('image/jpeg')
    expect(imageContentType('a.webp')).toBe('image/webp')
  })
})

describe('los SVG de content/', () => {
  it('no traen código: se abren como imagen y no pueden ejecutar nada', async () => {
    const images = (await listLessonImages(CONTENT_DIR)).filter(({ url }) => url.endsWith('.svg'))
    expect(images.length).toBeGreaterThan(0)
    for (const { source, url } of images) {
      const svg = await readFile(source, 'utf8')
      expect(svg, url).not.toMatch(
        /<script|<foreignObject|\son[a-z]+\s*=|javascript:|<image|href=/i,
      )
    }
  })
})
