-- Gestión de cuentas por admins: ver el estado del email (oculto en parte), cambiarlo, eliminar cuentas.
-- Todo lo que hace un admin aquí se anuncia en el chat general (transparencia).

create or replace function public.mask_email(e text) returns text
language sql immutable as $$
  select case when e is null or e = '' then null
    else left(split_part(e, '@', 1), 2) || '***@' || split_part(e, '@', 2) end
$$;

-- Estado de cada cuenta para los admins (email oculto en parte).
create or replace function public.admin_accounts()
returns table (id uuid, username text, email_masked text, email_confirmed boolean, email_pending_masked text)
language plpgsql stable security definer set search_path = public, auth as $$
begin
  if not public.is_admin() then raise exception 'Solo los admins'; end if;
  return query
    select p.id, p.username, public.mask_email(u.email::text), (u.email is not null and u.email_confirmed_at is not null),
           public.mask_email(nullif(u.email_change, ''))
    from profiles p join auth.users u on u.id = p.id order by p.created_at;
end $$;

-- Email real, solo para que la app de un admin pueda enviarle el enlace de acceso.
create or replace function public.admin_email_of(p_id uuid) returns text
language plpgsql stable security definer set search_path = public, auth as $$
begin
  if not public.is_admin() then raise exception 'Solo los admins'; end if;
  return (select email from auth.users where id = p_id and email_confirmed_at is not null);
end $$;

-- Poner (o corregir) el email de recuperación de un jugador. Queda confirmado y sirve para el enlace de acceso.
create or replace function public.admin_set_email(p_id uuid, p_email text) returns void
language plpgsql security definer set search_path = public, auth as $$
declare e text := lower(trim(p_email)); who text; admin_name text;
begin
  if not public.is_admin() then raise exception 'Solo los admins'; end if;
  if e !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then raise exception 'Email no válido'; end if;
  if exists (select 1 from auth.users where lower(email) = e and id <> p_id) then raise exception 'Ese email ya lo usa otra cuenta'; end if;
  update auth.users set email = e, email_confirmed_at = coalesce(email_confirmed_at, now()), is_anonymous = false,
         email_change = '', email_change_token_new = '', email_change_confirm_status = 0, updated_at = now()
   where id = p_id;
  insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (p_id::text, p_id, jsonb_build_object('sub', p_id::text, 'email', e, 'email_verified', true), 'email', now(), now(), now())
  on conflict (provider_id, provider) do update set identity_data = excluded.identity_data, updated_at = now();
  select username into who from profiles where id = p_id;
  select username into admin_name from profiles where id = auth.uid();
  insert into messages (channel, day, user_id, kind, body)
  values ('general', public.madrid_today(), auth.uid(), 'system', admin_name || ' ha cambiado el email de recuperación de ' || who);
end $$;

-- Eliminar una cuenta (y todo lo suyo). Nadie puede eliminarse a sí mismo desde aquí.
create or replace function public.admin_delete_user(p_id uuid) returns void
language plpgsql security definer set search_path = public, auth as $$
declare who text; admin_name text;
begin
  if not public.is_admin() then raise exception 'Solo los admins'; end if;
  if p_id = auth.uid() then raise exception 'No puedes eliminarte a ti mismo'; end if;
  select username into who from profiles where id = p_id;
  select username into admin_name from profiles where id = auth.uid();
  delete from auth.users where id = p_id;
  insert into messages (channel, day, user_id, kind, body)
  values ('general', public.madrid_today(), auth.uid(), 'system', admin_name || ' ha eliminado la cuenta de ' || coalesce(who, 'un jugador'));
end $$;

revoke all on function public.admin_accounts(), public.admin_email_of(uuid), public.admin_set_email(uuid, text), public.admin_delete_user(uuid) from public, anon;
grant execute on function public.admin_accounts(), public.admin_email_of(uuid), public.admin_set_email(uuid, text), public.admin_delete_user(uuid) to authenticated;
