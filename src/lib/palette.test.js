import { describe, it, expect } from 'vitest';
import { FAMILIES, fitLight, fitDark, contrast, famStyleAt } from './palette.js';

describe('paleta', () => {
  it('el texto blanco se lee sobre todos los tonos profundos (4.5:1)', () => {
    for (const [deep] of FAMILIES) expect(contrast(fitLight(deep), '#ffffff')).toBeGreaterThanOrEqual(4.5);
  });
  it('el texto oscuro se lee sobre todos los tonos medios en modo oscuro', () => {
    for (const [, mid] of FAMILIES) expect(contrast(fitDark(mid), '#0d1412')).toBeGreaterThanOrEqual(4.8);
  });
  it('dos colores seguidos nunca son de la misma familia', () => {
    for (let i = 0; i < 20; i++) expect(famStyleAt(i)).not.toBe(famStyleAt(i + 1));
  });
});
