// Lectores de los textos de "Compartir" de cada juego.
// Cada lector devuelve { value, failed, display, puzzle?, date? } o null si el texto no es de ese juego.
// Formatos sacados de ejemplos reales (18-nov-2026). Si un juego cambia su formato, se toca aquí y en parse.test.js.

import { madridToday } from './day.js';

const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
const num = (s) => Number(String(s).replace(',', '.'));

// Número de partida conocido en una fecha: sirve para saber qué número toca "hoy".
const ANCHORS = {
  poople: [461, '2026-11-18'],
  fermi: [115, '2026-11-18'],
  krillion: [126, '2026-11-18'],
  travle: [1435, '2026-11-18'],
  perceptle: [124, '2026-11-18']
};

export const PARSERS = {
  poople(t) {
    const m = t.match(/Poople\s*#(\d+)\s+(\d+|X)\s*\/\s*(\d+)/i);
    if (!m) return null;
    const failed = /x/i.test(m[2]);
    return { puzzle: +m[1], value: failed ? null : +m[2], failed, display: `${m[2].toUpperCase()}/${m[3]}` };
  },
  fermi(t) {
    const p = t.match(/Fermi\s*·?\s*No\.\s*(\d+)/i);
    const s = t.match(/([\d.,]+)\s*×\s*score(?:\s*·\s*top\s*(\d+)\s*%)?/i);
    if (!p || !s) return null;
    return { puzzle: +p[1], value: num(s[1]), failed: false, display: `${s[1]}×` + (s[2] ? ` · top ${s[2]}%` : '') };
  },
  krillion(t) {
    const m = t.match(/Krillion\s*#(\d+)[^\n]*\n\s*(\d+)/i);
    if (!m) return null;
    return { puzzle: +m[1], value: +m[2], failed: false, display: m[2] };
  },
  globle(t) {
    if (!/globle/i.test(t)) return null;
    const g = t.match(/=\s*(\d+)/);
    const d = t.match(/([A-Z][a-z]{2})\w*\s+(\d{1,2}),\s*(\d{4})/);
    if (!g) return null;
    return { date: d ? isoDate(d[3], d[1], d[2]) : null, value: +g[1], failed: false, display: `${g[1]} intentos` };
  },
  travle(t) {
    const m = t.match(/#travle\s*#(\d+)\s*([+-]?\d+|\(?X\)?)/i);
    if (!m) return null;
    const failed = /x/i.test(m[2]);
    const v = failed ? null : Number(m[2]);
    return { puzzle: +m[1], value: v, failed, display: failed ? 'X' : (v >= 0 ? `+${v}` : `${v}`) };
  },
  maptap(t) {
    if (!/maptap/i.test(t)) return null;
    const s = t.match(/Final score:\s*(\d+)/i);
    const d = t.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})/i);
    if (!s) return null;
    return { date: d ? isoDate(null, d[1], d[2]) : null, value: +s[1], failed: false, display: `${s[1]} pts` };
  },
  perceptle(t) {
    const m = t.match(/Perceptle\s*#(\d+)\s*-\s*([A-F][+-]?)\s*\((\d+)\)/i);
    if (!m) return null;
    return { puzzle: +m[1], value: +m[3], failed: false, display: `${m[3]} (${m[2].toUpperCase()})` };
  }
};

function isoDate(year, month, day) {
  const mo = MONTHS[month.slice(0, 3).toLowerCase()];
  const y = year || madridToday().slice(0, 4);
  return `${y}-${String(mo).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);

// ¿Es el resultado de hoy? Se admite ±1 día porque cada juego cambia de partida a su hora.
export function isToday(gameId, r, today = madridToday()) {
  if (r.date) return Math.abs(daysBetween(r.date, today)) <= 1;
  const a = ANCHORS[gameId];
  if (a && r.puzzle != null) return Math.abs(r.puzzle - (a[0] + daysBetween(a[1], today))) <= 1;
  return null; // no se puede saber
}

// ¿De qué juego es este texto? (para avisar si se pega en el juego equivocado)
export function detectGame(text) {
  for (const [id, fn] of Object.entries(PARSERS)) if (fn(text)) return id;
  return null;
}

// Punto de entrada: lee el texto para un juego concreto.
// Devuelve { ...resultado, verified } o { error } con un mensaje para la persona.
export function parseShare(text, game, today = madridToday()) {
  const t = String(text || '').trim();
  if (!t) return null;
  const own = PARSERS[game.id];
  if (own) {
    const r = own(t);
    if (!r) {
      const other = detectGame(t);
      return { error: other ? `Ese texto parece de otro juego (${other}).` : `No reconozco ese texto como un resultado de ${game.name}.` };
    }
    const ok = isToday(game.id, r, today);
    if (ok === false) return { error: 'Ese resultado no es de hoy.' };
    return { ...r, verified: ok === true };
  }
  return generic(t);
}

// Juegos sin lector propio: entiende "4/6", "X/6" o un número suelto. Nunca cuenta como verificado.
function generic(t) {
  const f = t.match(/(?:^|[^\d])([1-9]\d?|X)\s*\/\s*(\d{1,2})(?!\d)/i);
  if (f) {
    const failed = /x/i.test(f[1]);
    return { value: failed ? null : Number(f[1]), failed, display: `${f[1].toUpperCase()}/${f[2]}`, verified: false };
  }
  const n = t.replace(/(\d)\.(\d{3})/g, '$1$2').match(/-?\d+(?:[.,]\d+)?/);
  if (n && t.length <= 20) return { value: num(n[0]), failed: false, display: n[0], verified: false };
  return { error: 'No he sabido leer ese texto. Apunta el número con los botones.' };
}
