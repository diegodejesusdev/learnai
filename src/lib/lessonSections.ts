// Una lección es un Markdown con las mismas secciones (##) siempre. Aquí se parte en ellas, para
// el índice, para ocultar las respuestas y para avisar en el seed si falta alguna.
// Sin alias ni navegador: también lo usa scripts/seed-curriculum.ts.

/** Las secciones que lleva toda lección, en orden. */
export const LESSON_SECTIONS = [
  'Objetivo',
  'Lo esencial',
  'Explicación',
  'Ejemplo práctico',
  'Errores comunes',
  'Práctica',
  'Repaso',
  'Respuestas',
  'Para profundizar',
] as const

export interface LessonHeading {
  /** Único en la lección: es el ancla del índice. */
  id: string
  title: string
}

export interface LessonSubheading extends LessonHeading {
  /** Línea de `body` (desde 1) donde está, para ponerle su id al mostrarlo. */
  line: number
}

export interface LessonSection extends LessonHeading {
  /** El Markdown de la sección, sin su título. */
  body: string
  subheadings: LessonSubheading[]
}

/** Texto de un título sin el formato de Markdown. */
function plainTitle(text: string): string {
  return text
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[`*]|\b_|_\b/g, '')
    .trim()
}

export function slugify(title: string): string {
  const slug = title
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return slug || 'seccion'
}

/** Los ids que ya usa la página (el <main> de AppShell). */
const RESERVED_IDS = ['contenido', 'root']

function idMaker() {
  const used = new Set(RESERVED_IDS)
  return (title: string) => {
    const slug = slugify(title)
    let id = slug
    for (let count = 2; used.has(id); count += 1) id = `${slug}-${count}`
    used.add(id)
    return id
  }
}

/** Dice, línea por línea, si está dentro de un bloque de código (``` o ~~~). */
export function fenceTracker() {
  let open: string | null = null
  return (line: string): boolean => {
    const fence = /^\s*(`{3,}|~{3,})(.*)$/.exec(line)
    const marks = fence?.[1]
    if (marks === undefined) return open !== null
    if (open === null) {
      open = marks
      return true
    }
    const closes = marks[0] === open[0] && marks.length >= open.length && fence?.[2]?.trim() === ''
    if (closes) open = null
    return true
  }
}

/** Parte la lección en sus secciones. Un # dentro de un bloque de código no es un título. */
export function parseSections(markdown: string): LessonSection[] {
  const makeId = idMaker()
  const inCode = fenceTracker()
  const drafts: (LessonHeading & { lines: string[]; headings: Map<number, LessonHeading> })[] = []
  let current = {
    id: '',
    title: '',
    lines: [] as string[],
    headings: new Map<number, LessonHeading>(),
  }
  drafts.push(current)

  for (const line of markdown.split('\n')) {
    const heading = inCode(line) ? null : /^(#{2,3})\s+(.+?)\s*#*\s*$/.exec(line)
    const title = plainTitle(heading?.[2] ?? '')
    if (heading?.[1] === '##') {
      current = { id: makeId(title), title, lines: [], headings: new Map() }
      drafts.push(current)
      continue
    }
    if (heading) current.headings.set(current.lines.length, { id: makeId(title), title })
    current.lines.push(line)
  }

  return drafts
    .map(({ id, title, lines, headings }) => {
      // Al quitar las líneas vacías del principio, las de los subtítulos se corren.
      const skipped = Math.max(
        0,
        lines.findIndex((line) => line.trim() !== ''),
      )
      return {
        id,
        title,
        body: lines.join('\n').trim(),
        subheadings: [...headings].map(([index, heading]) => ({
          ...heading,
          line: index - skipped + 1,
        })),
      }
    })
    .filter((section) => section.title !== '' || section.body !== '')
}

/** El nombre de la sección sin lo que lleve entre paréntesis: «Práctica (15 minutos)». */
function sectionName(title: string): string {
  return title.replace(/\s*\([^)]*\)\s*$/, '').toLowerCase()
}

/** La sección que se muestra oculta, tras «Ver respuestas». */
export function isAnswers(section: LessonSection): boolean {
  return sectionName(section.title) === 'respuestas'
}

export function missingSections(markdown: string): string[] {
  const names = new Set(parseSections(markdown).map(({ title }) => sectionName(title)))
  return LESSON_SECTIONS.filter((name) => !names.has(name.toLowerCase()))
}
