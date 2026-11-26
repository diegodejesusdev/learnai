import { createReadStream } from 'node:fs'
import { readFile, stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig, type Plugin } from 'vitest/config'
import { LESSON_IMAGES_CACHE } from './src/lib/lessonImages.ts'
import { contentFileForUrl, imageContentType, listLessonImages } from './scripts/lessonImages.ts'

const CONTENT_DIR = fileURLToPath(new URL('./content', import.meta.url))

/**
 * Las imágenes de las lecciones (content/<ruta>/<fase>/img/) se publican en lessons/<ruta>/<fase>/img/.
 * Agregar una lección con diagramas = copiar el .md y su img/ y desplegar la app (el texto va a la
 * base con el seed; las imágenes, con el build).
 */
function lessonImages(): Plugin {
  return {
    name: 'learnai-lesson-images',
    async generateBundle() {
      for (const { source, url } of await listLessonImages(CONTENT_DIR)) {
        this.emitFile({ type: 'asset', fileName: url, source: await readFile(source) })
      }
    },
    // En desarrollo se sirven desde content/, sin copiarlas.
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const file = contentFileForUrl(CONTENT_DIR, (request.url ?? '').split('?')[0] ?? '')
        if (file === null) return next()
        stat(file).then(
          () => {
            response.setHeader('Content-Type', imageContentType(file))
            createReadStream(file).pipe(response)
          },
          () => next(),
        )
      })
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    lessonImages(),
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
        globIgnores: [
          '**/*-{cyrillic,cyrillic-ext,greek,greek-ext,vietnamese}-*.woff2',
          'lessons/**',
        ],
        // Los diagramas de las lecciones no se bajan todos al instalar: se guardan con su lección,
        // al verlos, al abrirla o al descargar la fase (src/features/leccion/lessonImageCache.ts).
        // Se sirven de la caché y se renuevan por detrás.
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/lessons/'),
            handler: 'StaleWhileRevalidate',
            options: { cacheName: LESSON_IMAGES_CACHE },
          },
        ],
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
