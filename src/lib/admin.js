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
