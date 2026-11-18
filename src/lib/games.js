import { supabase } from './supabase.js';

export async function loadGames() {
  const { data, error } = await supabase.from('games').select('*').eq('active', true).order('tier').order('sort');
  if (error) throw error;
  return data;
}

// Tono de color estable por juego (como en el artifact "Juegos de hoy").
export function hueOf(game, index = 0) {
  let x = 0;
  for (const c of String(game.id)) x = (x * 31 + c.charCodeAt(0)) % 360;
  return Math.round((x + index * 137.508) % 360);
}

export async function loadAllGames() {
  const { data, error } = await supabase.from('games').select('*').order('tier').order('sort');
  if (error) throw error;
  return data;
}

export async function upsertGame(game) {
  const { error } = await supabase.from('games').upsert(game);
  if (error) throw error;
}

export async function deleteGame(id) {
  const { error } = await supabase.from('games').delete().eq('id', id);
  if (error) throw error;
}

// Guarda el nuevo orden (1, 2, 3…) de una lista ya reordenada.
export async function saveOrder(list) {
  const changed = list.map((g, i) => ({ ...g, sort: i + 1 })).filter((g, i) => list[i].sort !== i + 1);
  if (changed.length) await upsertGame(changed);
}

export function slugify(name) {
  return name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30);
}
