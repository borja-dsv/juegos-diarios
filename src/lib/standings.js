import { rank } from './results.js';

export const POINTS = { 1: 3, 2: 2, 3: 1 };

// Clasificación de un periodo. rows: resultados {user_id, game_id, day, value, failed, profiles:{username}}.
// Cada juego y día se ordena por separado; 1º = 3 pts, 2º = 2, 3º = 1 (los empates comparten puesto y puntos).
// Orden final: puntos, luego victorias, luego nombre.
export function standings(rows, betterOf) {
  const groups = new Map();
  for (const r of rows) {
    const k = r.game_id + '|' + r.day;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(r);
  }
  const table = new Map();
  for (const [k, list] of groups) {
    const ranked = rank(list, betterOf(k.split('|')[0]));
    for (const r of ranked) {
      const t = table.get(r.user_id) || { user_id: r.user_id, name: r.profiles?.username ?? '?', points: 0, wins: 0, played: 0 };
      t.played++;
      t.points += POINTS[r.pos] || 0;
      if (r.pos === 1) t.wins++;
      table.set(r.user_id, t);
    }
  }
  const sorted = [...table.values()].sort((a, b) => b.points - a.points || b.wins - a.wins || a.name.localeCompare(b.name));
  let pos = 0;
  return sorted.map((t, i) => {
    const prev = sorted[i - 1];
    if (!prev || prev.points !== t.points || prev.wins !== t.wins) pos = i + 1;
    return { ...t, pos };
  });
}

// Primer día del periodo (fechas YYYY-MM-DD en hora de España).
export function periodStart(period, today) {
  if (period === 'all') return '2000-01-01';
  if (period === 'day') return today;
  const d = new Date(today + 'T12:00:00Z');
  if (period === 'month') d.setUTCDate(1);
  else d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); // lunes
  return d.toISOString().slice(0, 10);
}

// Días seguidos con al menos un resultado, contando hasta hoy (o hasta ayer si hoy aún no hay).
export function streak(days, today) {
  const set = new Set(days);
  const d = new Date(today + 'T12:00:00Z');
  if (!set.has(today)) d.setUTCDate(d.getUTCDate() - 1);
  let n = 0;
  while (set.has(d.toISOString().slice(0, 10))) { n++; d.setUTCDate(d.getUTCDate() - 1); }
  return n;
}

// Ordena una tabla {user_id, username, points, wins, played} y le pone puesto (empates = mismo puesto).
export function placeTable(rows) {
  const sorted = rows.map((r) => ({ ...r, name: r.username ?? r.name ?? '?' }))
    .sort((a, b) => b.points - a.points || b.wins - a.wins || a.name.localeCompare(b.name));
  let pos = 0;
  return sorted.map((t, i) => {
    const prev = sorted[i - 1];
    if (!prev || prev.points !== t.points || prev.wins !== t.wins) pos = i + 1;
    return { ...t, pos };
  });
}
