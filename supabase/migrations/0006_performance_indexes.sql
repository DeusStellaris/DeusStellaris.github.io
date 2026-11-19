-- 0006: índices de rendimiento para las consultas más frecuentes.
--
-- Consultas cubiertas:
--  * Reseñas por demo (slug), ordenadas por fecha: ya cubierta por reviews_demo_idx (0004); la
--    paginación por offset/limit usa ese mismo índice.
--  * Promedio y cantidad de reseñas (review_stats): índice parcial que solo incluye publicadas y
--    guarda la nota, así el agregado se resuelve sin leer la tabla.
--  * Ranking y conteo de me gusta por proyecto: la restricción única (project_slug, visitor_hash)
--    ya cubre ambas consultas; likes_project_slug_idx queda redundante y se elimina.
--  * Envío de avisos push por modo e idioma, y limpieza por antigüedad.

create index if not exists reviews_published_stats_idx
  on public.reviews (demo_slug) include (rating)
  where status = 'published';

drop index if exists public.likes_project_slug_idx;

create index if not exists push_subscriptions_mode_locale_idx
  on public.push_subscriptions (mode, locale);

drop index if exists public.push_subscriptions_mode_idx;

create index if not exists push_subscriptions_updated_at_idx
  on public.push_subscriptions (updated_at);
