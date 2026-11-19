import { describe, it, expect } from 'vitest';
import { standings, periodStart, streak } from './standings.js';

const u = (id) => ({ username: id });
const rows = [
  // Día 1, juego "low" (gana el más bajo): ana 2, bea 2 (empate 1º), carl 4 (3º)
  { user_id: 'ana', game_id: 'w', day: '2026-11-16', value: 2, failed: false, profiles: u('ana') },
  { user_id: 'bea', game_id: 'w', day: '2026-11-16', value: 2, failed: false, profiles: u('bea') },
  { user_id: 'carl', game_id: 'w', day: '2026-11-16', value: 4, failed: false, profiles: u('carl') },
  // Día 1, juego "high": carl gana, ana 2ª
  { user_id: 'carl', game_id: 'm', day: '2026-11-16', value: 900, failed: false, profiles: u('carl') },
  { user_id: 'ana', game_id: 'm', day: '2026-11-16', value: 800, failed: false, profiles: u('ana') }
];
const betterOf = (g) => (g === 'w' ? 'low' : 'high');

describe('standings', () => {
  it('suma 3-2-1 por puesto y cuenta victorias, con empates', () => {
    const s = standings(rows, betterOf);
    expect(s.map((t) => [t.name, t.points, t.wins, t.pos])).toEqual([
      ['ana', 5, 1, 1],   // 3 (empate 1º) + 2
      ['carl', 4, 1, 2],  // 1 (3º) + 3
      ['bea', 3, 1, 3]
    ]);
  });
});

describe('periodStart', () => {
  it('semana empieza en lunes', () => expect(periodStart('week', '2026-11-18')).toBe('2026-11-16'));
  it('mes empieza el día 1', () => expect(periodStart('month', '2026-11-18')).toBe('2026-11-01'));
  it('hoy empieza hoy', () => expect(periodStart('day', '2026-11-18')).toBe('2026-11-18'));
});

describe('streak', () => {
  it('cuenta días seguidos hasta hoy', () => expect(streak(['2026-11-18', '2026-11-17', '2026-11-15'], '2026-11-18')).toBe(2));
  it('si hoy aún no has jugado, cuenta hasta ayer', () => expect(streak(['2026-11-17', '2026-11-16'], '2026-11-18')).toBe(2));
});

import { placeTable } from './standings.js';
describe('placeTable', () => {
  it('ordena por puntos y victorias, empates comparten puesto', () => {
    const t = placeTable([
      { user_id: 'a', username: 'ana', points: 5, wins: 1, played: 2 },
      { user_id: 'b', username: 'bea', points: 5, wins: 1, played: 1 },
      { user_id: 'c', username: 'carl', points: 6, wins: 0, played: 3 }
    ]);
    expect(t.map((x) => [x.name, x.pos])).toEqual([['carl', 1], ['ana', 2], ['bea', 2]]);
  });
});
