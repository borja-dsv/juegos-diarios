import { supabase } from './supabase.js';
import { madridToday } from './day.js';

// Mis resultados de hoy, como { game_id: resultado }.
export async function loadMyToday(userId) {
  const { data, error } = await supabase.from('results').select('*')
    .eq('user_id', userId).eq('day', madridToday());
  if (error) throw error;
  return Object.fromEntries(data.map((r) => [r.game_id, r]));
}

// Resultados de hoy de un juego, con el nombre de cada jugador.
// Las reglas de la base de datos solo los dejan ver si ya has registrado el tuyo.
export async function loadGameDay(gameId, day = madridToday()) {
  const { data, error } = await supabase.from('results')
    .select('id, user_id, value, failed, display, source, created_at, profiles(username)')
    .eq('game_id', gameId).eq('day', day);
  if (error) throw error;
  return data;
}

export async function saveResult(r) {
  const { data, error } = await supabase.from('results').insert(r).select().single();
  if (error) throw error;
  return data;
}

// Ordena y pone puesto (los empates comparten puesto).
// Primero los que tienen número (según si gana el más bajo o el más alto),
// después los fallos y al final los "hecho, sin resultado".
export function rank(rows, better) {
  const group = (r) => (r.failed ? 1 : r.value == null ? 2 : 0);
  const sorted = [...rows].sort((a, b) =>
    group(a) - group(b) || (group(a) === 0 ? (better === 'low' ? a.value - b.value : b.value - a.value) : 0));
  let pos = 0;
  return sorted.map((r, i) => {
    const prev = sorted[i - 1];
    const tie = prev && group(prev) === group(r) && (group(r) !== 0 || prev.value === r.value);
    if (!tie) pos = i + 1;
    return { ...r, pos: group(r) === 0 ? pos : null };
  });
}

// Recuerda qué juego abriste y cuándo, para pedirte el resultado al volver.
const KEY = 'jd.playing';
export function markPlaying(gameId) {
  try { localStorage.setItem(KEY, JSON.stringify({ gameId, t: Date.now(), day: madridToday() })); } catch {}
}
export function getPlaying() {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (p && p.day === madridToday() && Date.now() - p.t < 6 * 3600e3) return p;
  } catch {}
  return null;
}
export function clearPlaying() {
  try { localStorage.removeItem(KEY); } catch {}
}
