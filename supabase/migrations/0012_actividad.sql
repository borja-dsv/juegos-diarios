-- Actividad de cada jugador (para los admins): última vez que abrió la app y cuántas veces.
alter table public.profiles add column if not exists last_seen_at timestamptz;
alter table public.profiles add column if not exists visits int not null default 0;

-- La app lo llama al abrirse. Una "visita" = abrir la app tras al menos 30 minutos sin usarla.
create or replace function public.touch_seen() returns void
language sql security definer set search_path = public as $$
  update profiles
     set visits = visits + case when last_seen_at is null or last_seen_at < now() - interval '30 minutes' then 1 else 0 end,
         last_seen_at = now()
   where id = auth.uid();
$$;
revoke all on function public.touch_seen() from public, anon;
grant execute on function public.touch_seen() to authenticated;

-- Estado de cada cuenta para los admins, ahora con actividad.
drop function if exists public.admin_accounts();
create function public.admin_accounts()
returns table (id uuid, username text, email_masked text, email_confirmed boolean, email_pending_masked text,
               last_seen_at timestamptz, visits int, results_total bigint, results_today bigint)
language plpgsql stable security definer set search_path = public, auth as $$
begin
  if not public.is_admin() then raise exception 'Solo los admins'; end if;
  return query
    select p.id, p.username, public.mask_email(u.email::text), (u.email is not null and u.email_confirmed_at is not null),
           public.mask_email(nullif(u.email_change, '')),
           coalesce(p.last_seen_at, u.last_sign_in_at), p.visits,
           (select count(*) from results r where r.user_id = p.id),
           (select count(*) from results r where r.user_id = p.id and r.day = public.madrid_today())
    from profiles p join auth.users u on u.id = p.id order by p.created_at;
end $$;
revoke all on function public.admin_accounts() from public, anon;
grant execute on function public.admin_accounts() to authenticated;
