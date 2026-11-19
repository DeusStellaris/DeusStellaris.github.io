-- 0004: reseñas reales de las demos jugables (puntuación 1-5 y comentario opcional).
--
-- Principios:
--  * Zero Fake Reviews: ninguna fila se siembra. Cada fila nace de un envío real a través del Worker.
--  * Una reseña por visitante y demo (restricción única); volver a enviar la reemplaza.
--  * visitor_hash es un HMAC: no hay IP, nombre ni correo. Nunca se devuelve al navegador.
--  * El comentario es texto plano: la base rechaza < y > y caracteres de control, además del saneado del Worker.
--  * RLS activado y sin políticas: solo service_role (el Worker) lee y escribe.
--  * status permite ocultar una reseña abusiva sin borrar el historial.

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.reviews (
  id           uuid primary key default gen_random_uuid(),
  demo_slug    text not null check (demo_slug ~ '^[A-Za-z0-9][A-Za-z0-9_-]{0,119}$'),
  visitor_hash text not null check (visitor_hash ~ '^[0-9a-f]{64}$'),
  rating       smallint not null check (rating between 1 and 5),
  comment      text not null default ''
    check (
      char_length(comment) <= 500
      and comment !~ '[<>]'
      and comment !~ E'[\\x01-\\x08\\x0b\\x0c\\x0e-\\x1f\\x7f]'
    ),
  locale       text not null check (locale in ('es', 'en')),
  status       text not null default 'published' check (status in ('published', 'hidden')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (demo_slug, visitor_hash)
);

create index reviews_demo_idx on public.reviews (demo_slug, status, created_at desc);

create trigger reviews_touch_updated_at
  before update on public.reviews
  for each row execute function public.touch_updated_at();

-- Cantidad y promedio de reseñas publicadas de una demo.
create or replace function public.review_stats(p_slug text)
returns table (review_count integer, average_rating numeric)
language sql
stable
set search_path = ''
as $$
  select count(*)::integer, round(avg(rating)::numeric, 2)
  from public.reviews
  where demo_slug = p_slug and status = 'published';
$$;

alter table public.reviews enable row level security;

revoke all on table public.reviews from public, anon, authenticated;
grant select, insert, update on table public.reviews to service_role;
revoke all on function public.review_stats(text) from public, anon, authenticated;
grant execute on function public.review_stats(text) to service_role;
