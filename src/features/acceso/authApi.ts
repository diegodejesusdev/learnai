import { supabase, supabaseEnv } from '@/lib/supabase'

// Tras el enlace mágico o Google se vuelve a /login, que redirige al inicio al detectar la sesión.
function loginRedirectUrl(): string {
  return `${window.location.origin}/login`
}

export async function sendMagicLink(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: loginRedirectUrl() },
  })
  if (error) throw error
}

/** El mismo correo trae un código: sirve para la PWA instalada en iPhone, donde el enlace abre Safari. */
export async function verifyEmailCode(email: string, code: string): Promise<void> {
  const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' })
  if (error) throw error
}

export async function signInWithGoogle(): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: loginRedirectUrl(), queryParams: { prompt: 'select_account' } },
  })
  if (error) throw error
}

/** Cierra la sesión solo en este dispositivo. */
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut({ scope: 'local' })
  if (error) throw error
}

export interface AuthProviders {
  email: boolean
  google: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/** Qué métodos de acceso están activos en Supabase (para no mostrar un botón que falla). */
export async function fetchAuthProviders(): Promise<AuthProviders> {
  const response = await fetch(`${supabaseEnv.url}/auth/v1/settings`, {
    headers: { apikey: supabaseEnv.anonKey },
  })
  if (!response.ok)
    throw new Error(`No se pudo leer la configuración de acceso (${response.status})`)
  const body: unknown = await response.json()
  const external = isRecord(body) && isRecord(body.external) ? body.external : {}
  return { email: external.email === true, google: external.google === true }
}
