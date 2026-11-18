-- Correcciones de admins: cada cambio o anulación queda anunciado en el chat del juego (transparencia).
create or replace function public.results_correction_announce() returns trigger
language plpgsql security definer set search_path = public as $$
declare admin_name text; player text;
begin
  select username into admin_name from profiles where id = auth.uid();
  select username into player from profiles where id = coalesce(new.user_id, old.user_id);
  if tg_op = 'UPDATE' then
    if new.display is distinct from old.display or new.failed is distinct from old.failed then
      insert into messages (channel, day, user_id, kind, body)
      values (new.game_id, new.day, auth.uid(), 'system',
              coalesce(admin_name, 'Un admin') || ' ha corregido el resultado de ' || player || ': ' || old.display || ' → ' || new.display);
    end if;
    return new;
  else
    insert into messages (channel, day, user_id, kind, body)
    values (old.game_id, old.day, auth.uid(), 'system',
            coalesce(admin_name, 'Un admin') || ' ha anulado el resultado de ' || player || ' (' || old.display || ')');
    return old;
  end if;
end $$;

create trigger results_correction_announce after update or delete on public.results
  for each row execute function public.results_correction_announce();

-- Solo los admins pueden marcar corrected_by, y siempre con su propio id.
create or replace function public.results_mark_corrected() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.corrected_by := auth.uid();
  new.user_id := old.user_id; new.game_id := old.game_id; new.day := old.day; -- no se cambia de quién ni de qué día es
  return new;
end $$;

create trigger results_mark_corrected before update on public.results
  for each row execute function public.results_mark_corrected();
