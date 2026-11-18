// Colores por familias, con las reglas de "Mis finanzas":
// - cada familia tiene un tono profundo (modo claro) y uno medio (modo oscuro);
// - en cada visita cambian de orden y dos seguidos nunca son de la misma familia;
// - el contraste del texto se garantiza ajustando el tono (4.5:1 como mínimo).
// Paleta "Joya profunda": zafiro, verde azulado, ocre, ciruela e índigo.
export const FAMILIES = [
  ['#1d4f91', '#4a80c4'],
  ['#0f6b6b', '#3a9c96'],
  ['#a3700c', '#d6a53c'],
  ['#6b2d5c', '#a65a90'],
  ['#3b3f8f', '#7276c6']
];
const INK = '#0d1412'; // texto sobre botones en modo oscuro

const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const hex = (c) => '#' + c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
const lum = (h) => { const [r, g, b] = rgb(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
export const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const mix = (h, to, k) => hex(rgb(h).map((v) => v + ((to === 'w' ? 255 : 0) - v) * k));
// Oscurece hasta que el texto blanco se lea bien encima.
export function fitLight(c) { let i = 0; while (contrast(c, '#ffffff') < 4.5 && i++ < 30) c = mix(c, 'k', 0.06); return c; }
// Aclara hasta que el texto oscuro se lea bien encima.
export function fitDark(c) { let i = 0; while (contrast(c, INK) < 4.8 && i++ < 30) c = mix(c, 'w', 0.08); return c; }

// Orden aleatorio por visita, sin dos familias iguales seguidas (el ciclo lo garantiza).
const order = FAMILIES.map((_, i) => i).sort(() => Math.random() - 0.5);
const assigned = new Map();
let next = 0;

export function famStyleAt(i) {
  const [deep, mid] = FAMILIES[order[((i % order.length) + order.length) % order.length]];
  return `--f-deep:${fitLight(deep)};--f-mid:${fitDark(mid)}`;
}
// Mismo color para el mismo juego durante toda la visita.
export function famStyleFor(id) {
  if (!assigned.has(id)) assigned.set(id, next++);
  return famStyleAt(assigned.get(id));
}
