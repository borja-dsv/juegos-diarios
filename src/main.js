import './app.css';
import { applyTheme } from './lib/theme.js';
import { famStyleAt } from './lib/palette.js';

applyTheme(); // antes de pintar, para que no parpadee

// Botones generales: una familia de color al azar en cada visita (como en Mis finanzas).
document.documentElement.classList.add('fam');
document.documentElement.setAttribute('style', famStyleAt(Math.floor(Math.random() * 5)));
import { mount } from 'svelte';
import { registerSW } from 'virtual:pwa-register';

// Actualizaciones: al haber versión nueva, se activa y la app se recarga sola.
// Se busca al abrir, al volver a la app y cada 30 minutos.
registerSW({
  immediate: true,
  onRegisteredSW(_url, reg) {
    if (!reg) return;
    const check = () => reg.update().catch(() => {});
    setInterval(check, 30 * 60 * 1000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
  }
});
import App from './App.svelte';

mount(App, { target: document.getElementById('app') });
