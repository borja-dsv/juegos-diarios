-- Ajustes del grupo (una sola fila). auto_approve = los nuevos entran sin esperar a un admin.
create table public.app_settings (
  id           int primary key default 1 check (id = 1),
  auto_approve boolean not null default true,
  updated_at   timestamptz not null default now()
);
insert into public.app_settings (id, auto_approve) values (1, true) on conflict (id) do nothing;

alter table public.app_settings enable row level security;
create policy "aprobados leen ajustes" on public.app_settings for select to authenticated using (public.is_approved());
create policy "admins cambian ajustes" on public.app_settings for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
grant select, update on public.app_settings to authenticated;
revoke all on public.app_settings from anon;

-- El primero sigue siendo admin; los demás entran aprobados si el registro está abierto.
create or replace function public.profiles_before_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from profiles) then
    new.status := 'approved'; new.is_admin := true;
  elsif coalesce((select auto_approve from app_settings where id = 1), false) then
    new.status := 'approved'; new.is_admin := false;
  else
    new.status := 'pending'; new.is_admin := false;
  end if;
  new.created_at := now();
  return new;
end $$;

-- Quien estuviera esperando, entra ya.
update public.profiles set status = 'approved' where status = 'pending';
