-- Imagen de cada juego: la imagen oficial de vista previa que publica cada web (og:image),
-- enlazada (no copiada) desde su propio servidor. Si no carga, la app usa la textura de su categoría.
alter table public.games add column if not exists image_url text check (image_url is null or image_url ~ '^https://');
update public.games set image_url = v.url from (values
  ('noilirk',    'https://noillirk.com/images/home/og.jpg'),
  ('stranded',   'https://stranded.run/share/home.png'),
  ('fermi',      'https://fermi.gg/fermi_share_image.jpg'),
  ('krillion',   'https://krillion.io/og.png'),
  ('globle',     'https://globle-game.com/globle-preview.png'),
  ('travle',     'https://travle.earth/images/previews/countries_preview.png'),
  ('flagle',     'https://www.flagle.io/images/flagle_og.png'),
  ('timeguessr', 'https://timeguessr.com/og-default.png'),
  ('whenere',    'https://whenere.net/og-image.png')
) as v(id, url) where games.id = v.id;
