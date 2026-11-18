import { supabase } from './supabase.js';

export async function loadGames() {
  const { data, error } = await supabase.from('games').select('*').eq('active', true).order('sort');
  if (error) throw error;
  return data;
}

// Tono de color estable por juego (como en el artifact "Juegos de hoy").
export function hueOf(game, index = 0) {
  let x = 0;
  for (const c of String(game.id)) x = (x * 31 + c.charCodeAt(0)) % 360;
  return Math.round((x + index * 137.508) % 360);
}
