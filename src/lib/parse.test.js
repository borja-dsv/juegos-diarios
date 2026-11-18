import { describe, it, expect } from 'vitest';
import { parseShare } from './parse.js';
import { rank } from './results.js';

const worldle = { id: 'worldle', name: 'Worldle' };

describe('parseShare (genérico)', () => {
  it('entiende intentos tipo 4/6', () => {
    expect(parseShare('#Worldle #1023 4/6 (100%)', worldle)).toMatchObject({ value: 4, failed: false, display: '4/6', verified: true });
  });
  it('entiende un fallo X/6', () => {
    expect(parseShare('Worldle X/6', worldle)).toMatchObject({ value: null, failed: true, display: 'X/6' });
  });
  it('entiende un número suelto', () => {
    expect(parseShare('38.450', worldle)).toMatchObject({ value: 38450 });
  });
  it('devuelve null si no hay nada que leer', () => {
    expect(parseShare('hola', worldle)).toBeNull();
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
