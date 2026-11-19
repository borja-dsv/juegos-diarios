-- Temporadas: el ranking cuenta desde season_start. Reiniciar no borra resultados (se puede deshacer).
alter table public.app_settings add column if not exists season_start date not null default '2026-11-18';

-- Ranking: igual que antes, pero sin contar nada anterior al inicio de la temporada.
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

-- Admins: empezar temporada en una fecha (hoy por defecto). Se anuncia en el chat general.
create or replace function public.admin_set_season_start(p_day date) returns void
language plpgsql security definer set search_path = public as $$
declare admin_name text;
begin
  if not public.is_admin() then raise exception 'Solo los admins'; end if;
  update app_settings set season_start = p_day, updated_at = now() where id = 1;
  select username into admin_name from profiles where id = auth.uid();
  insert into messages (channel, day, user_id, kind, body)
  values ('general', public.madrid_today(), auth.uid(), 'system',
          admin_name || ' ha reiniciado el ranking: cuenta desde el ' || to_char(p_day, 'DD/MM/YYYY'));
end $$;
revoke all on function public.admin_set_season_start(date) from public, anon;
grant execute on function public.admin_set_season_start(date) to authenticated;
