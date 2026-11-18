-- 1) Valor mínimo de los botones de cada juego (0 o 1). Wordle/Worldle/Flagle: a la primera = 1.
alter table public.games add column if not exists min_value numeric not null default 1 check (min_value in (0, 1));
update public.games set min_value = 0 where id = 'poople';

-- 2) Ranking de un periodo calculado en la base de datos, INCLUYENDO HOY.
--    Solo devuelve totales (puntos, victorias, partidas), nunca los resultados de hoy de cada uno.
--    1º = 3 pts, 2º = 2, 3º = 1; empates comparten puesto. Fallos y "sin resultado" no puntúan.
create or replace function public.standings(p_from date, p_game text default null, p_tier smallint default null)
returns table (user_id uuid, username text, points int, wins int, played int)
language sql stable security definer set search_path = public as $$
  with r as (
    select res.user_id, res.game_id, res.day, res.value, res.failed, g.better
    from results res join games g on g.id = res.game_id
    where public.is_approved() and res.day >= p_from
      and (p_game is null or res.game_id = p_game)
      and (p_tier is null or g.tier = p_tier)
  ),
  ranked as (
    select r.*, case when not r.failed and r.value is not null then
             rank() over (partition by r.game_id, r.day, (not r.failed and r.value is not null)
                          order by case when r.better = 'low' then r.value end asc,
                                   case when r.better = 'high' then r.value end desc)
           end as pos
    from r
  )
  select k.user_id, p.username,
         coalesce(sum(case k.pos when 1 then 3 when 2 then 2 when 3 then 1 else 0 end), 0)::int,
         count(*) filter (where k.pos = 1)::int,
         count(*)::int
  from ranked k join profiles p on p.id = k.user_id
  group by k.user_id, p.username
$$;
revoke all on function public.standings(date, text, smallint) from public, anon;
grant execute on function public.standings(date, text, smallint) to authenticated;
