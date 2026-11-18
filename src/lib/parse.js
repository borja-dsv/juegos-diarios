// Lee un texto de "Compartir". De momento es GENÉRICO: entiende "4/6" y "X/6" o un número suelto.
// Cuando tengamos ejemplos reales de cada juego, aquí irá un lector específico por juego.

export function mentionsGame(text, game) {
  const t = text.toLowerCase();
  return [game.name, game.id].some((n) => n && t.includes(n.toLowerCase().replace(/-/g, ' ').split(' ')[0]));
}

export function parseShare(text, game) {
  const t = String(text || '').trim();
  if (!t) return null;
  const f = t.match(/(?:^|[^\d])([1-9]\d?|X)\s*\/\s*(\d{1,2})(?!\d)/i);
  if (f) {
    const failed = /x/i.test(f[1]);
    return { value: failed ? null : Number(f[1]), failed, display: `${f[1].toUpperCase()}/${f[2]}`, verified: mentionsGame(t, game) };
  }
  const n = t.replace(/(\d)\.(\d{3})/g, '$1$2').match(/-?\d+(?:[.,]\d+)?/);
  if (n && t.length <= 20) {
    const value = Number(n[0].replace(',', '.'));
    return { value, failed: false, display: n[0], verified: false };
  }
  return null;
}
