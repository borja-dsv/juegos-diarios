import { supabase } from './supabase.js';
import { madridToday } from './day.js';

const COLS = 'id, channel, day, user_id, kind, body, created_at, profiles(username)';

// General: los últimos 200 mensajes. Juego: solo los de hoy.
export async function loadMessages(channel) {
  let q = supabase.from('messages').select(COLS).eq('channel', channel);
  if (channel !== 'general') q = q.eq('day', madridToday());
  const { data, error } = await q.order('created_at', { ascending: false }).limit(200);
  if (error) throw error;
  return data.reverse();
}

export async function sendMessage(channel, body) {
  const { error } = await supabase.from('messages').insert({ channel, body });
  if (error) throw error;
}

// Avisa de cada mensaje nuevo del canal. Devuelve una función para dejar de escuchar.
export function subscribe(channel, onInsert) {
  const sub = supabase
    .channel('chat:' + channel)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `channel=eq.${channel}` },
      (payload) => onInsert(payload.new))
    .subscribe();
  return () => supabase.removeChannel(sub);
}

export async function usernameOf(id) {
  const { data } = await supabase.from('profiles').select('username').eq('id', id).maybeSingle();
  return data?.username ?? '?';
}
