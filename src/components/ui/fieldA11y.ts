/** Id del texto de ayuda o error de un campo, para aria-describedby. */
export function describedById(
  id: string,
  hint?: string,
  error?: string | null,
): string | undefined {
  return error || hint ? `${id}-hint` : undefined
}
