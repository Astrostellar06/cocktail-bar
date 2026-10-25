import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  // Sur GitHub Pages, l'app vit dans un sous-dossier (/<dépôt>/) : la CI le passe via BASE_PATH.
  base: process.env.BASE_PATH ?? '/',
  build: {
    // Un seul bundle, mis en cache par le service worker : sa taille n'est pas critique.
    chunkSizeWarningLimit: 700,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Mon Bar',
        short_name: 'Mon Bar',
        description: 'Mon bar personnel et les cocktails que je peux préparer.',
        lang: 'fr',
        theme_color: '#FF4FA3',
        background_color: '#FFF4E0',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // woff2 seulement : le woff de secours ne sert qu'aux très vieux navigateurs.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
      },
    }),
  ],
})
