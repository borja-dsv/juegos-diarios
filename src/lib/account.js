import { supabase } from './supabase.js';

export const USERNAME_RE = /^[A-Za-z0-9_.áéíóúñÁÉÍÓÚÑ-]{2,20}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Traduce los errores habituales a algo que se entienda.
export function humanError(e) {
  const m = String(e?.message || e || '');
  if (/profiles_username_lower|duplicate key/i.test(m)) return 'Ese nombre ya está cogido. Prueba con otro.';
  if (/signups not allowed/i.test(m)) return 'No hay ninguna cuenta con ese email confirmado. Si es tu primera vez, regístrate. Si ya te registraste, pide ayuda a un admin del grupo.';
  if (/rate limit|too many/i.test(m)) return 'Se han enviado demasiados emails seguidos. Espera un rato (hasta una hora) y vuelve a probar.';
  if (/anonymous sign-ins are disabled/i.test(m)) return 'El registro aún no está activado. Avisa al admin.';
  if (/token has expired|invalid/i.test(m)) return 'El código no es válido o ha caducado. Pide otro.';
  if (/fetch|network/i.test(m)) return 'Sin conexión. Revisa internet y vuelve a probar.';
  return 'Algo ha fallado: ' + m;
}

// Registro: crea una sesión en este dispositivo (sin contraseña), el perfil con el nombre
// y asocia el email para poder recuperar la cuenta más adelante.
export async function register(username, email) {
  let { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    session = data.session;
  }
  const { error: pErr } = await supabase.from('profiles').insert({ id: session.user.id, username });
  if (pErr) throw pErr;
  // El email se confirma con un enlace. Si falla (p. ej. límite de emails), la cuenta sigue funcionando.
  const { error: eErr } = await supabase.auth.updateUser({ email }, { emailRedirectTo: appUrl() });
  return { emailPending: !eErr, emailError: eErr ? humanError(eErr) : null };
}

// Dirección de la app (la misma en local y publicada), adonde vuelven los enlaces del email.
export function appUrl() {
  return window.location.origin + import.meta.env.BASE_URL;
}

// Recuperar la cuenta en otro dispositivo: enlace de acceso al email.
// Al abrirlo, Supabase vuelve a la app con la sesión y supabase-js la recoge sola.
export async function sendLoginLink(email) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false, emailRedirectTo: appUrl() }
  });
  if (error) throw error;
}

export async function loadProfile(userId) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data;
}

// Añadir o volver a enviar el email de recuperación (cuentas creadas sin que se guardara el email).
export async function linkEmail(email) {
  const { error } = await supabase.auth.updateUser({ email }, { emailRedirectTo: appUrl() });
  if (error) throw error;
}
