-- Ajustes según los textos de Compartir reales (18-nov-2026).
update public.games set max_value = 5, better = 'low' where id = 'poople';
update public.games set better = 'low', max_value = null where id in ('fermi', 'travle', 'globle');
update public.games set better = 'high', max_value = null where id in ('maptap', 'perceptle', 'krillion');

-- Poople: 5/5 = perfecto (0 intentos de más) → gana el más alto.
update public.games set better = 'high' where id = 'poople';
