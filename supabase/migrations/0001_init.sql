-- Juegos diarios · esquema inicial
-- Tablas: profiles (jugadores), games (lista de juegos), results (un resultado por juego, jugador y día).
-- Seguridad: RLS en todas las tablas. Solo el rol "authenticated" tiene permisos; "anon" no ve nada.

-- ───────────── Utilidades ─────────────

-- "Hoy" según la hora de España: todas las reglas de día usan esta función.
create or replace function public.madrid_today() returns date
language sql stable as $$ select (now() at time zone 'Europe/Madrid')::date $$;

-- ───────────── Jugadores ─────────────

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  username    text not null check (username ~ '^[A-Za-z0-9_.áéíóúñÁÉÍÓÚÑ-]{2,20}$'),
  status      text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now()
);
create unique index profiles_username_lower on public.profiles (lower(username));

-- Funciones de permisos. SECURITY DEFINER para poder usarlas dentro de las propias reglas
-- sin bucles; solo leen el perfil de quien hace la petición.
create or replace function public.is_approved() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and status = 'approved')
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and status = 'approved' and is_admin)
$$;

-- El primer jugador que se registra (Borja) entra aprobado y como admin.
-- Los demás quedan pendientes. Nadie puede auto-aprobarse ni hacerse admin.
create or replace function public.profiles_before_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from profiles) then
    new.status := 'approved';
    new.is_admin := true;
  else
    new.status := 'pending';
    new.is_admin := false;
  end if;
  new.created_at := now();
  return new;
end $$;

create trigger profiles_before_insert before insert on public.profiles
  for each row execute function public.profiles_before_insert();

alter table public.profiles enable row level security;

create policy "ver perfiles" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin() or (public.is_approved() and status = 'approved'));

create policy "crear mi perfil" on public.profiles for insert to authenticated
  with check (id = auth.uid());

create policy "admins gestionan perfiles" on public.profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "admins borran perfiles" on public.profiles for delete to authenticated
  using (public.is_admin() and id <> auth.uid());

-- ───────────── Juegos ─────────────

create table public.games (
  id          text primary key check (id ~ '^[a-z0-9-]{2,30}$'),
  name        text not null,
  url         text not null check (url ~ '^https://'),
  emoji       text not null default '🎯',
  category    text not null default 'Otros',
  open_mode   text not null default 'external' check (open_mode in ('embed', 'external')),
  better      text not null default 'low' check (better in ('low', 'high')),
  max_value   numeric,              -- p. ej. 6 en juegos de 6 intentos; null = número libre
  sort        int not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.games enable row level security;

create policy "aprobados ven juegos" on public.games for select to authenticated
  using (public.is_approved());

create policy "admins gestionan juegos" on public.games for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ───────────── Resultados ─────────────

create table public.results (
  id           bigint generated always as identity primary key,
  game_id      text not null references public.games (id) on delete cascade,
  user_id      uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  day          date not null default public.madrid_today(),
  value        numeric,                      -- null = "hecho, sin resultado"
  failed       boolean not null default false,
  display      text not null check (char_length(display) <= 40),
  raw          text check (char_length(raw) <= 3000),   -- texto de Compartir original
  source       text not null check (source in ('share', 'manual')),
  opened_at    timestamptz,                  -- cuándo abrió el juego desde la app
  created_at   timestamptz not null default now(),
  corrected_by uuid references public.profiles (id),
  unique (game_id, user_id, day)
);
create index results_day_game on public.results (day, game_id);

-- ¿Ha registrado ya el jugador actual este juego en este día?
create or replace function public.played(p_game text, p_day date) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from results where game_id = p_game and day = p_day and user_id = auth.uid())
$$;

alter table public.results enable row level security;

-- Anti-trampas: los resultados de HOY de un juego solo se ven después de registrar el tuyo.
create policy "ver resultados" on public.results for select to authenticated
  using (public.is_approved() and (
    user_id = auth.uid() or day < public.madrid_today() or public.played(game_id, day) or public.is_admin()
  ));

-- Solo puedes registrar lo tuyo, solo el día de hoy y sin marcas de corrección.
create policy "registrar mi resultado" on public.results for insert to authenticated
  with check (public.is_approved() and user_id = auth.uid()
              and day = public.madrid_today() and corrected_by is null);

-- Corregir o anular: solo admins.
create policy "admins corrigen" on public.results for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "admins anulan" on public.results for delete to authenticated
  using (public.is_admin());

-- ───────────── Permisos de la API ─────────────
-- La API no da acceso automático a tablas nuevas: lo concedemos aquí, tabla a tabla.

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles, public.games, public.results to authenticated;
grant execute on function public.madrid_today(), public.is_approved(), public.is_admin(), public.played(text, date) to authenticated;
revoke all on public.profiles, public.games, public.results from anon;

-- ───────────── Juegos iniciales ─────────────
-- open_mode según la prueba del 7-nov-2026 (docs/PLAN.md).
-- better / max_value: provisionales hasta tener ejemplos reales; un admin puede cambiarlos.

insert into public.games (id, name, url, emoji, category, open_mode, better, max_value, sort) values
  ('wordle-es',  'Wordle Español', 'https://wordle.es',              '🟩', 'Palabras',        'external', 'low',  6,    1),
  ('poople',     'Poople',         'https://poople.io',              '💩', 'Palabras',        'embed',    'low',  6,    2),
  ('noilirk',    'Noilirk',        'https://noillirk.com/',          '🧠', 'Palabras',        'embed',    'high', null, 3),
  ('stranded',   'Stranded',       'https://stranded.run/',          '👽', 'Palabras',        'embed',    'high', null, 4),
  ('fermi',      'Fermi',          'https://fermi.gg',               '📏', 'Números',         'embed',    'low',  null, 5),
  ('krillion',   'Krillion',       'https://krillion.io',            '🦐', 'Cultura general', 'external', 'high', null, 6),
  ('worldle',    'Worldle',        'https://worldle.com/daily',      '🗺️', 'Geografía',       'embed',    'low',  6,    7),
  ('globle',     'Globle',         'https://globle-game.com/game',   '🌍', 'Geografía',       'embed',    'low',  null, 8),
  ('travle',     'Travle',         'https://travle.earth',           '🧭', 'Geografía',       'external', 'low',  null, 9),
  ('maptap',     'MapTap',         'https://maptap.gg/',             '📍', 'Geografía',       'embed',    'high', null, 10),
  ('flagle',     'Flagle',         'https://www.flagle.io/',         '🏳️', 'Geografía',       'external', 'low',  6,    11),
  ('perceptle',  'Perceptle',      'https://perceptle.com/',         '👁️', 'Lógica',          'external', 'high', null, 12),
  ('timeguessr', 'TimeGuessr',     'https://timeguessr.com/es',      '⏳', 'Historia',        'embed',    'high', null, 13),
  ('whenere',    'Whenere',        'https://whenere.net/',           '🕰️', 'Otros',           'embed',    'high', null, 14);
