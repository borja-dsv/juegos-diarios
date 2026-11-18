-- Nivel de cada juego (1 = T1, los que más molan; 2 = T2, el resto). Orden dentro de cada nivel: sort.
alter table public.games add column if not exists tier smallint not null default 2 check (tier between 1 and 5);

update public.games g set tier = 1, sort = v.sort from (values
  ('wordle-es', 1), ('fermi', 2), ('krillion', 3), ('maptap', 4), ('travle', 5), ('globle', 6), ('perceptle', 7)
) as v(id, sort) where g.id = v.id;

update public.games g set tier = 2, sort = v.sort from (values
  ('poople', 10), ('noilirk', 11), ('stranded', 12), ('worldle', 13), ('flagle', 14), ('timeguessr', 15), ('whenere', 16)
) as v(id, sort) where g.id = v.id;
