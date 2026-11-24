import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // La app avisa cuando hay una versión nueva y la instala al tocar «Actualizar»
      // (src/app/UpdatePrompt.tsx registra el service worker).
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['icon-wine.svg', 'icon-wine.ico', 'icon-wine-apple-180x180.png'],
      manifest: {
        id: '/',
        name: 'LearnAI',
        short_name: 'LearnAI',
        description: 'Tus rutas de estudio, con temporizador, historial y tutor.',
        lang: 'es-CO',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#faf9f9',
        theme_color: '#171214',
        categories: ['education', 'productivity'],
        // Íconos generados con npm run pwa:icons (pwa-assets.config.ts).
        icons: [
          { src: 'icon-wine-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'icon-wine-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-wine-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icon-wine-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          { name: 'Estudiar', short_name: 'Estudiar', url: '/estudiar' },
          { name: '¿Qué estudio hoy?', short_name: 'Hoy', url: '/tutor?modo=hoy' },
        ],
      },
      workbox: {
        // Todo el build queda en caché (también los fragmentos del Historial y el Tutor):
        // la app abre sin conexión. Los datos se guardan aparte (TanStack Query persistido).
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // De la fuente Inter basta el latín (con tildes y ñ); los demás alfabetos no se usan.
        globIgnores: ['**/*-{cyrillic,cyrillic-ext,greek,greek-ext,vietnamese}-*.woff2'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  build: {
    rolldownOptions: {
      output: {
        // Menos archivos en la primera carga: sin esto, cada sección partía el código común en
        // decenas de fragmentos de 1–2 kB, y en el móvil cada uno suma latencia.
        codeSplitting: {
          groups: [
            {
              // Librerías que usa toda la app (Recharts y el Markdown siguen aparte).
              name: 'vendor',
              test: /node_modules[\\/](react|react-dom|react-router|scheduler|@tanstack|@supabase|lucide-react|date-fns|@date-fns|workbox-window)[\\/]/,
              priority: 2,
            },
            // Código de la app que usan varias secciones.
            { name: 'shared', test: /[\\/]src[\\/]/, minShareCount: 2, priority: 1 },
          ],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // Código que comparten la app y la Edge Function del tutor (sin Deno ni navegador).
      '@shared': fileURLToPath(new URL('./supabase/functions/_shared', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Valores falsos: los tests nunca llaman a Supabase de verdad.
    env: {
      VITE_SUPABASE_URL: 'http://supabase.test',
      VITE_SUPABASE_ANON_KEY: 'clave-de-prueba',
    },
  },
})
