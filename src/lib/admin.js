import { supabase } from './supabase.js';

export async function loadPlayers() {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at');
  if (error) throw error;
  return data;
}

export async function setStatus(id, status) {
  const { error } = await supabase.from('profiles').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function setAdmin(id, isAdmin) {
  const { error } = await supabase.from('profiles').update({ is_admin: isAdmin }).eq('id', id);
  if (error) throw error;
}

// Registro abierto (los nuevos entran sin aprobación) o cerrado (un admin los aprueba).
export async function loadAutoApprove() {
  const { data, error } = await supabase.from('app_settings').select('auto_approve').eq('id', 1).maybeSingle();
  if (error) throw error;
  return data?.auto_approve ?? false;
}
export async function setAutoApprove(on) {
  const { error } = await supabase.from('app_settings').update({ auto_approve: on, updated_at: new Date().toISOString() }).eq('id', 1);
  if (error) throw error;
}

// Gestión de cuentas (solo admins; la base de datos lo comprueba y lo anuncia en el chat general).
export async function loadAccounts() {
  const { data, error } = await supabase.rpc('admin_accounts');
  if (error) throw error;
  return Object.fromEntries(data.map((a) => [a.id, a]));
}
export async function adminSetEmail(id, email) {
  const { error } = await supabase.rpc('admin_set_email', { p_id: id, p_email: email });
  if (error) throw error;
}
export async function adminDeleteUser(id) {
  const { error } = await supabase.rpc('admin_delete_user', { p_id: id });
  if (error) throw error;
}
// Envía a ese jugador un email con un enlace para entrar en su cuenta.
export async function adminSendAccessLink(id) {
  const { data: email, error } = await supabase.rpc('admin_email_of', { p_id: id });
  if (error) throw error;
  if (!email) throw new Error('Esta cuenta no tiene un email confirmado. Ponle uno primero.');
  const { error: e2 } = await supabase.auth.signInWithOtp({
    email, options: { shouldCreateUser: false, emailRedirectTo: window.location.origin + import.meta.env.BASE_URL }
  });
  if (e2) throw e2;
}

// Temporada del ranking: desde qué día cuenta. Reiniciar no borra resultados.
export async function loadSeasonStart() {
  const { data, error } = await supabase.from('app_settings').select('season_start').eq('id', 1).maybeSingle();
  if (error) throw error;
  return data?.season_start ?? '2000-01-01';
}
export async function setSeasonStart(day) {
  const { error } = await supabase.rpc('admin_set_season_start', { p_day: day });
  if (error) throw error;
}
