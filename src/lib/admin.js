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
