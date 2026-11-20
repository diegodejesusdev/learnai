// Avisos al terminar un bloque: sonido suave, vibración y notificación del navegador.

let audioContext: AudioContext | null = null

/**
 * Los navegadores (sobre todo iOS) solo dejan sonar audio si se «desbloqueó» con un toque.
 * Se llama al tocar Iniciar o Reanudar.
 */
export function unlockAudio(): void {
  try {
    audioContext ??= new AudioContext()
    if (audioContext.state === 'suspended') void audioContext.resume()
  } catch {
    audioContext = null
  }
}

/** Dos notas suaves (sin archivos de audio). */
export function playChime(): void {
  const context = audioContext
  if (!context || context.state !== 'running') return
  const start = context.currentTime
  for (const [index, frequency] of [880, 1318.5].entries()) {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    const at = start + index * 0.22
    oscillator.type = 'sine'
    oscillator.frequency.value = frequency
    gain.gain.setValueAtTime(0, at)
    gain.gain.linearRampToValueAtTime(0.12, at + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.9)
    oscillator.connect(gain).connect(context.destination)
    oscillator.start(at)
    oscillator.stop(at + 1)
  }
}

export function vibrate(): void {
  // iOS no tiene Vibration API: no hace nada.
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate([200, 100, 200])
}

export type NotificationState = 'unsupported' | NotificationPermission

export function notificationState(): NotificationState {
  return typeof window !== 'undefined' && 'Notification' in window
    ? Notification.permission
    : 'unsupported'
}

export async function requestNotifications(): Promise<NotificationState> {
  if (notificationState() === 'unsupported') return 'unsupported'
  return Notification.requestPermission()
}

export function showNotification(title: string, body: string): void {
  if (notificationState() !== 'granted') return
  try {
    new Notification(title, { body, icon: '/favicon.svg', tag: 'learnai-pomodoro' })
  } catch {
    // En Android Chrome se necesita un service worker (llega con la PWA, fase 7).
  }
}
