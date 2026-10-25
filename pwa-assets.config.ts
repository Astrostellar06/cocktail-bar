import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Icônes « maskable » (Android) et Apple : la marge ajoutée autour du logo est rose, comme son fond.
// Sinon le lanceur découpe une marge blanche et le carré rose apparaît au milieu de l'icône ronde.
const pinkMargin = { resizeOptions: { background: '#FF4FA3' } }

export default defineConfig({
  preset: {
    ...minimal2023Preset,
    // 20 % de marge : tout le dessin reste dans la zone sûre (cercle central) des icônes Android.
    maskable: { ...minimal2023Preset.maskable, padding: 0.2, ...pinkMargin },
    apple: { ...minimal2023Preset.apple, padding: 0.1, ...pinkMargin },
  },
  images: ['public/logo.svg'],
})
