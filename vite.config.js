import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';

// La web se publica en https://borja-dsv.github.io/juegos-diarios/
const base = '/juegos-diarios/';

export default defineConfig({
  base,
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Juegos diarios',
        short_name: 'Juegos',
        description: 'Juegos diarios con amigos: resultados, rankings y chat.',
        lang: 'es',
        start_url: base,
        scope: base,
        display: 'standalone',
        background_color: '#F2F1F8',
        theme_color: '#5A3FE0',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }
        ]
      }
    })
  ]
});
