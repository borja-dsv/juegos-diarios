import './app.css';
import { applyTheme } from './lib/theme.js';
import { famStyleAt } from './lib/palette.js';

applyTheme(); // antes de pintar, para que no parpadee

// Botones generales: una familia de color al azar en cada visita (como en Mis finanzas).
document.documentElement.classList.add('fam');
document.documentElement.setAttribute('style', famStyleAt(Math.floor(Math.random() * 5)));
import { mount } from 'svelte';
import App from './App.svelte';

mount(App, { target: document.getElementById('app') });
