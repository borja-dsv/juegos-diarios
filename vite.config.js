import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';

// La web se publica en https://borja-dsv.github.io/juegos-diarios/
const base = '/juegos-diarios/';

// Versión: fecha y hora de la publicación (hora de España), para ver en Ajustes si el móvil tiene la última.
const VERSION = new Intl.DateTimeFormat('es-ES', { timeZone: 'Europe/Madrid', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date());

export default defineConfig({
  base,
  define: { __APP_VERSION__: JSON.stringify(VERSION) },
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false, // lo registramos en main.js para buscar versiones nuevas y recargar solos
      manifest: {
        name: 'Juegos diarios',
        short_name: 'Juegos',
        description: 'Juegos diarios con amigos: resultados, rankings y chat.',
        lang: 'es',
        start_url: base,
        scope: base,
        display: 'standalone',
        background_color: '#F6F2EC',
        theme_color: '#16191E',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      }
    })
  ]
});
