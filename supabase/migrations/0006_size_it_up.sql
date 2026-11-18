-- Size it up (Magnitudle): se abre dentro de la app (probado el 18-nov-2026, partida #101). Puntuación: gana la más alta.
insert into public.games (id, name, url, emoji, category, open_mode, better, max_value, sort, tier, image_url) values
  ('size-it-up', 'Size it up', 'https://magnitudle.com/size-it-up', '📐', 'Números', 'embed', 'high', null, 8, 1,
   'https://magnitudle.com/icon-magnitude-og.png')
on conflict (id) do nothing;
