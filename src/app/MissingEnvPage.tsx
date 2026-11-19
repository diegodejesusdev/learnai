import { Settings2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'

/** Se muestra si faltan las variables de Supabase, en vez de una página en blanco. */
export function MissingEnvPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg items-center px-4 py-10">
      <title>Falta configuración · LearnAI</title>
      <Card className="flex flex-col gap-3">
        <Settings2 className="size-8 text-accent" />
        <h1 className="text-xl font-semibold">Falta conectar Supabase</h1>
        <p className="text-sm text-fg-muted">
          La app necesita <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code>.
        </p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-fg-muted">
          <li>
            En tu PC: copia <code>.env.example</code> como <code>.env.local</code>, completa los
            valores y reinicia <code>npm run dev</code>.
          </li>
          <li>En Vercel: agrégalas en Settings → Environment Variables y vuelve a desplegar.</li>
        </ul>
      </Card>
    </main>
  )
}
