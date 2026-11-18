// Fecha de hoy en España (YYYY-MM-DD), igual que madrid_today() en la base de datos.
export function madridToday(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(now);
}

export function longDate(now = new Date()) {
  const s = now.toLocaleDateString('es-ES', { timeZone: 'Europe/Madrid', weekday: 'long', day: 'numeric', month: 'long' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}
