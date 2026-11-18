import { createClient } from '@supabase/supabase-js';

// Datos PÚBLICOS del proyecto (pensados para ir en la web).
// La seguridad la ponen las reglas RLS de supabase/migrations. Nunca pongas aquí la clave secreta.
const SUPABASE_URL = 'https://swwmqdmbhogsccicxfki.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_aYsuzTLGfIGGtdYI91LGtQ_DQsGZ_Lf';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true }
});
