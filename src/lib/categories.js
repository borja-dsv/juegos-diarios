// Identidad visual de cada categoría: color, tono oscuro para texto, fondo suave y textura (CSS).
export const CATS = {
  'Palabras':        { fill: '#F4B740', deep: '#7A4800', tint: '#FFF3D9', pat: 'linear-gradient(90deg, rgba(255,255,255,.55) 3px, transparent 3px) 0 0 / 18px 18px, linear-gradient(rgba(255,255,255,.55) 3px, transparent 3px) 0 0 / 18px 18px' },
  'Geografía':       { fill: '#2FB585', deep: '#0B6B52', tint: '#DDF5EC', pat: 'repeating-radial-gradient(circle at 85% 120%, transparent 0 9px, rgba(255,255,255,.45) 9px 10.5px)' },
  'Números':         { fill: '#4C83F0', deep: '#1F4FB8', tint: '#E2ECFF', pat: 'linear-gradient(rgba(255,255,255,.35) 1px, transparent 1px) 0 0 / 12px 12px, linear-gradient(90deg, rgba(255,255,255,.35) 1px, transparent 1px) 0 0 / 12px 12px' },
  'Historia':        { fill: '#B97A4A', deep: '#7A4522', tint: '#F6E9DC', pat: 'repeating-linear-gradient(135deg, rgba(255,255,255,.3) 0 2px, transparent 2px 9px)' },
  'Lógica':          { fill: '#8F67F0', deep: '#5B33B8', tint: '#ECE5FF', pat: 'radial-gradient(circle, rgba(255,255,255,.5) 1.6px, transparent 1.8px) 0 0 / 11px 11px' },
  'Cultura general': { fill: '#E0559A', deep: '#9C2560', tint: '#FCE3EF', pat: 'repeating-conic-gradient(from 0deg at 100% 0%, rgba(255,255,255,.3) 0 5deg, transparent 5deg 15deg)' },
  'Otros':           { fill: '#6B7590', deep: '#434C63', tint: '#E8EBF2', pat: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,.25), transparent 60%)' }
};
export const CATEGORY_NAMES = Object.keys(CATS);

export const cat = (name) => CATS[name] || CATS.Otros;

// Variables CSS para pintar un elemento con los colores de su categoría.
export function catStyle(name) {
  const c = cat(name);
  return `--c-fill:${c.fill};--c-deep:${c.deep};--c-tint:${c.tint};--c-pat:${c.pat}`;
}
