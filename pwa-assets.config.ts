import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Íconos de la PWA a partir de public/favicon.svg: npm run pwa:icons
// El ícono maskable (Android) y el de iPhone llevan fondo del color de la app y margen:
// el sistema los recorta en círculo o con esquinas redondeadas.
const fullBleed = { padding: 0.3, resizeOptions: { background: '#0f766e' } }

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, ...fullBleed },
    apple: { ...minimal2023Preset.apple, ...fullBleed },
  },
  images: ['public/favicon.svg'],
})
