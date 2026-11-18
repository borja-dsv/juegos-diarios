import { describe, it, expect } from 'vitest';
import { parseShare, detectGame } from './parse.js';
import { rank } from './results.js';

// Textos reales de Compartir, 18-nov-2026.
const TODAY = '2026-11-18';
const EX = {
  poople: 'Poople #461 5/5\n⬜🟫⬜⬜\n⬜🟫⬜⬜\n⬜🟫⬜⬜\n⬜🟫🟫⬜\n⬜🟫🟫🟫\n🟫🟫🟫🟫\n\nhttps://poople.io/',
  fermi: 'Fermi · No. 115\n01 ↓ 1.68×\n02 ↓ 2.26×\n03 ↓ 6.00×\n─────────\n2.83× score · top 12%\n<https://fermi.gg/s/daily>',
  krillion: 'Krillion #126 🦐\n360\n\n🫧🏮🦑🦑🏮⬛🦑',
  globle: '🌎 Nov 18, 2026 🌍\n🔥 1 | Avg. Guesses: 6\n⬜⬜🟨🟥🟥🟩 = 6\n\nhttps://globle-game.com\n#globle',
  travle: '#travle #1435 +2\n🟧✅🟥✅✅✅\nhttps://travle.earth',
  maptap: '[www.maptap.gg](https://www.maptap.gg) November 18\n84💫 71😐 94🏅 98🔥 90👑\nFinal score: 907',
  perceptle: 'Perceptle #124 - C (69)\n🔢 95  🎯 91  📐 87  🥁 4  ✂️ 68\nhttps://perceptle.com'
};
const g = (id, name = id) => ({ id, name });

describe('lectores por juego (ejemplos reales)', () => {
  const cases = [
    ['poople', 5, '5/5'], ['fermi', 2.83, '2.83× · top 12%'], ['krillion', 360, '360'],
    ['globle', 6, '6 intentos'], ['travle', 2, '+2'], ['maptap', 907, '907 pts'], ['perceptle', 69, '69 (C)']
  ];
  for (const [id, value, display] of cases) {
    it(id, () => {
      expect(parseShare(EX[id], g(id), TODAY)).toMatchObject({ value, display, failed: false, verified: true });
    });
  }
  it('rechaza un resultado de otro día', () => {
    expect(parseShare(EX.travle, g('travle'), '2026-11-25')).toEqual({ error: 'Ese resultado no es de hoy.' });
    expect(parseShare(EX.globle, g('globle'), '2026-12-01').error).toMatch(/no es de hoy/);
  });
  it('acepta el día siguiente (cada juego cambia a su hora)', () => {
    expect(parseShare(EX.poople, g('poople'), '2026-11-19').verified).toBe(true);
  });
  it('avisa si pegas el texto de otro juego', () => {
    expect(parseShare(EX.fermi, g('poople', 'Poople'), TODAY).error).toMatch(/otro juego \(fermi\)/);
    expect(detectGame(EX.maptap)).toBe('maptap');
  });
  it('fallo en Poople', () => {
    expect(parseShare('Poople #461 X/5', g('poople'), TODAY)).toMatchObject({ failed: true, value: null });
  });
});

describe('juegos sin lector propio', () => {
  const w = g('worldle', 'Worldle');
  it('entiende 4/6 pero no lo marca como verificado', () => {
    expect(parseShare('#Worldle #1023 4/6', w)).toMatchObject({ value: 4, verified: false });
  });
  it('mensaje si no entiende nada', () => {
    expect(parseShare('hola', w).error).toBeTruthy();
  });
});

describe('rank', () => {
  const rows = [
    { id: 1, value: 4, failed: false }, { id: 2, value: 2, failed: false },
    { id: 3, value: null, failed: true }, { id: 4, value: 2, failed: false }
  ];
  it('menos es mejor, empates comparten puesto, fallos al final', () => {
    expect(rank(rows, 'low').map((r) => [r.id, r.pos])).toEqual([[2, 1], [4, 1], [1, 3], [3, null]]);
  });
  it('más es mejor', () => {
    expect(rank(rows, 'high')[0].id).toBe(1);
  });
});
