// Apariencia: 'system' (como el móvil), 'light' o 'dark'. Se recuerda en este dispositivo.
const KEY = 'jd.theme';
const COLORS = { light: '#F9F9F7', dark: '#0B0B0B' };

export function getTheme() {
  try { return localStorage.getItem(KEY) || 'system'; } catch { return 'system'; }
}

export function applyTheme(theme = getTheme()) {
  const root = document.documentElement;
  if (theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
  const dark = theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? COLORS.dark : COLORS.light);
}

export function setTheme(theme) {
  try { localStorage.setItem(KEY, theme); } catch {}
  applyTheme(theme);
}

// Si está en "Sistema", sigue los cambios del móvil.
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => applyTheme());
