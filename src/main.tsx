import '@fontsource-variable/inter'
import './styles/index.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MissingEnvPage } from './app/MissingEnvPage'
import { readSupabaseEnv } from './lib/env'
import { listenForInstallPrompt } from './lib/installPrompt'

// Antes de pintar: Chrome avisa que la app se puede instalar apenas carga la página.
listenForInstallPrompt()

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('No se encontró el elemento #root')
const root = createRoot(rootElement)

if (readSupabaseEnv()) {
  // Import dinámico: el cliente de Supabase solo se crea cuando hay configuración.
  const { App } = await import('./app/App')
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
} else {
  root.render(
    <StrictMode>
      <MissingEnvPage />
    </StrictMode>,
  )
}
