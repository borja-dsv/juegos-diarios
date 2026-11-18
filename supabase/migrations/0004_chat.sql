-- Chat: un canal general ('general') y uno por juego (channel = id del juego).
-- Los chats de juego van por día: el de hoy solo se ve tras apuntar tu resultado (anti-spoilers).

create table public.messages (
  id          bigint generated always as identity primary key,
  channel     text not null check (channel = 'general' or channel ~ '^[a-z0-9-]{2,30}$'),
  day         date not null default public.madrid_today(),
  user_id     uuid references public.profiles (id) on delete cascade default auth.uid(),
  kind        text not null default 'user' check (kind in ('user', 'system')),
  body        text not null check (char_length(body) between 1 and 500),
  created_at  timestamptz not null default now()
);
create index messages_channel_day on public.messages (channel, day, created_at);

alter table public.messages enable row level security;

create policy "ver mensajes" on public.messages for select to authenticated
  using (public.is_approved() and (
    channel = 'general' or day < public.madrid_today() or public.played(channel, day) or public.is_admin()
  ));

create policy "escribir mensajes" on public.messages for insert to authenticated
  with check (public.is_approved() and user_id = auth.uid() and kind = 'user'
              and day = public.madrid_today()
              and (channel = 'general' or public.played(channel, day)));

create policy "borrar mis mensajes" on public.messages for delete to authenticated
  using (user_id = auth.uid() or public.is_admin());

grant select, insert, delete on public.messages to authenticated;
revoke all on public.messages from anon;

-- Aviso automático en el chat del juego cuando alguien apunta un resultado.
create or replace function public.results_announce() returns trigger
language plpgsql security definer set search_path = public as $$
declare who text;
begin
  select username into who from profiles where id = new.user_id;
  insert into messages (channel, day, user_id, kind, body)
  values (new.game_id, new.day, new.user_id, 'system',
          who || ' ha registrado ' || new.display || case when new.source = 'share' then ' · verificado' else ' · manual' end);
  return new;
end $$;

create trigger results_announce after insert on public.results
  for each row execute function public.results_announce();

-- Mensajes en tiempo real (respetan las reglas de arriba).
alter publication supabase_realtime add table public.messages;
