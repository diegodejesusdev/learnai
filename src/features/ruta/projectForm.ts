/** '' → null (sin enlace); si no, el texto sin espacios alrededor. */
export function normalizeUrl(value: string): string | null {
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

/** Mensaje de error para un enlace, o null si es válido (vacío también es válido). */
export function urlError(value: string): string | null {
  const url = normalizeUrl(value)
  if (url === null) return null
  // Misma regla que la base (check ^https?://) más que sea una URL que se pueda abrir.
  // (try/catch en vez de URL.canParse, que no existe en iOS 16.)
  try {
    const parsed = new URL(url)
    if (/^https?:\/\//i.test(url) && parsed.hostname !== '') return null
  } catch {
    // no es una URL
  }
  return 'Escribe el enlace completo, empezando por https://'
}
