import './app.css';
import { applyTheme } from './lib/theme.js';

applyTheme(); // antes de pintar, para que no parpadee
import { mount } from 'svelte';
import App from './App.svelte';

mount(App, { target: document.getElementById('app') });
