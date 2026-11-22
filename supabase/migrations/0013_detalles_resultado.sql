-- Detalles de un resultado (p. ej. las 5 áreas de Perceptle), leídos del texto de Compartir.
alter table public.results add column if not exists details jsonb check (details is null or pg_column_size(details) < 2000);

-- Rellenar los Perceptle ya apuntados a partir del texto original guardado.
update public.results r set details = jsonb_build_object(
    'count', m[1]::int, 'track', m[2]::int, 'angle', m[3]::int, 'tempo', m[4]::int, 'split', m[5]::int)
from (select id, regexp_match(raw, '🔢\s*(\d+)\s*🎯\s*(\d+)\s*📐\s*(\d+)\s*🥁\s*(\d+)\s*✂\S*\s*(\d+)') as m
      from public.results where game_id = 'perceptle' and raw is not null) x
where r.id = x.id and x.m is not null;
