import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { readSupabaseEnv } from './env'

const env = readSupabaseEnv()
if (!env) throw new Error('Faltan VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY (ver .env.example).')

export const supabaseEnv = env

export const supabase = createClient<Database>(env.url, env.anonKey, {
  auth: {
    // La sesión vive en localStorage y se renueva sola: sigue abierta al cerrar y reabrir el móvil.
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Flujo implícito: el enlace mágico funciona aunque lo abras en otro navegador o dispositivo
    // (con PKCE solo funcionaría en el mismo navegador donde lo pediste).
    flowType: 'implicit',
  },
})
