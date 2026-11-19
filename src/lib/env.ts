export interface SupabaseEnv {
  url: string
  anonKey: string
}

/** Variables públicas de Supabase (ver .env.example). null si faltan. */
export function readSupabaseEnv(): SupabaseEnv | null {
  const url = import.meta.env.VITE_SUPABASE_URL
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  return url && anonKey ? { url, anonKey } : null
}
