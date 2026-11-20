/**
 * Id único (UUID v4) generado en el dispositivo: identifica una sesión antes de que llegue a
 * la base, para que reintentarla desde la cola no la duplique.
 * crypto.randomUUID solo existe en contextos seguros (HTTPS o localhost); al probar desde el
 * móvil por la IP de la Wi-Fi (http) se arma a mano con getRandomValues, que sí existe.
 */
export function newId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40 // versión 4
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80 // variante RFC 4122
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
