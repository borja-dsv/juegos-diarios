-- Juego del día: un T1 al azar, el mismo para todos, que no repite el de ayer. Sus puntos valen ×2.
-- La elección se guarda para que el ranking de días pasados no cambie si cambia la lista de juegos.
create table public.daily_pick (
  day      date primary key,
  game_id  text not null references public.games (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.daily_pick enable row level security;
create policy "aprobados ven el juego del día" on public.daily_pick for select to authenticated using (public.is_approved());
grant select on public.daily_pick to authenticated;
revoke all on public.daily_pick from anon;

-- Devuelve el juego del día (y lo elige la primera vez que alguien lo pide ese día).
create or replace function public.game_of_day() returns text
language plpgsql security definer set search_path = public as $$
declare d date := public.madrid_today(); g text; prev text;
begin
  if not public.is_approved() then return null; end if;
  select game_id into g from daily_pick where day = d;
  if g is not null then return g; end if;
  select game_id into prev from daily_pick where day = d - 1;
  select id into g from games
   where active and tier = 1 and id is distinct from prev
   order by random() limit 1;
  if g is null then return null; end if;
  insert into daily_pick (day, game_id) values (d, g) on conflict (day) do nothing;
  select game_id into g from daily_pick where day = d;   -- por si dos personas lo pidieron a la vez
  return g;
end $$;
revoke all on function public.game_of_day() from public, anon;
grant execute on function public.game_of_day() to authenticated;

-- Ranking: igual que antes, pero el juego del día puntúa doble (las victorias cuentan una).
create or replace function public.standings(p_from date, p_game text default null, p_tier smallint default null)
returns table (user_id uuid, username text, points int, wins int, played int)
language sql stable security definer set search_path = public as $$
  with r as (
    select res.user_id, res.game_id, res.day, res.value, res.failed, g.better
    from results res join games g on g.id = res.game_id
    where public.is_approved()
      and res.day >= greatest(p_from, (select season_start from app_settings where id = 1))
      and (p_game is null or res.game_id = p_game)
      and (p_tier is null or g.tier = p_tier)
  ),
  ranked as (
    select r.*, case when not r.failed and r.value is not null then
             rank() over (partition by r.game_id, r.day, (not r.failed and r.value is not null)
                          order by case when r.better = 'low' then r.value end asc,
                                   case when r.better = 'high' then r.value end desc)
           end as pos,
           case when exists (select 1 from daily_pick dp where dp.day = r.day and dp.game_id = r.game_id) then 2 else 1 end as mult
    from r
  )
  select k.user_id, p.username,
         coalesce(sum(k.mult * case k.pos when 1 then 3 when 2 then 2 when 3 then 1 else 0 end), 0)::int,
         count(*) filter (where k.pos = 1)::int,
         count(*)::int
  from ranked k join profiles p on p.id = k.user_id
  group by k.user_id, p.username
$$;
