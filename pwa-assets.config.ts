import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Íconos de la PWA a partir de public/icon-wine.svg: npm run pwa:icons
// Si cambia el dibujo o el color, cambia también el nombre: los navegadores (Safari sobre todo)
// guardan el ícono por dirección y seguirían mostrando el anterior.
// El ícono maskable (Android) y el de iPhone llevan fondo del color de la app y margen:
// el sistema los recorta en círculo o con esquinas redondeadas.
const fullBleed = { padding: 0.3, resizeOptions: { background: '#6b0f2a' } }

const NAME = 'icon-wine'

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    assetName: (type, { width, height }) =>
      type === 'transparent'
        ? `${NAME}-${width}x${height}.png`
        : `${NAME}-${type}-${width}x${height}.png`,
    transparent: { ...minimal2023Preset.transparent, favicons: [[48, `${NAME}.ico`]] },
    maskable: { ...minimal2023Preset.maskable, ...fullBleed },
    apple: { ...minimal2023Preset.apple, ...fullBleed },
  },
  images: [`public/${NAME}.svg`],
})
