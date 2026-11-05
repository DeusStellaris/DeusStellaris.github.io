-- 0001: me gusta por proyecto, ranking y límite de frecuencia.
--
-- Modelo de seguridad:
--  * RLS activado en todas las tablas y SIN políticas: anon y authenticated no pueden leer
--    ni escribir filas. Solo service_role (Worker de la API) accede a las tablas.
--  * El navegador solo llama a funciones de lectura que devuelven agregados (contadores).
--  * Las funciones de escritura o de límite de frecuencia no son ejecutables por anon.
--  * Las funciones usan search_path vacío y nombres totalmente calificados (evita secuestro
--    por search_path).
--
-- Aplicar con la CLI de Supabase (ver supabase/README.md). Migración reversible a mano:
--   drop function ...; drop table ...;  (no hay datos externos que conservar en esta fase)

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------

create table public.likes (
  id           uuid primary key default gen_random_uuid(),
  project_slug text not null
    check (char_length(project_slug) between 1 and 120
           and project_slug ~ '^[A-Za-z0-9][A-Za-z0-9_-]*$'),
  -- HMAC-SHA256 del identificador anónimo del visitante, calculado en el Worker. Nunca el UUID en claro.
  visitor_hash text not null
    check (char_length(visitor_hash) = 64 and visitor_hash ~ '^[0-9a-f]{64}$'),
  created_at   timestamptz not null default now(),
  constraint likes_one_per_visitor unique (project_slug, visitor_hash)
);

create index likes_project_slug_idx on public.likes (project_slug);
create index likes_created_at_idx on public.likes (created_at);

create table public.rate_limit_hits (
  bucket_key   text not null check (char_length(bucket_key) between 1 and 200),
  window_start timestamptz not null,
  hits         integer not null default 0 check (hits >= 0),
  primary key (bucket_key, window_start)
);

create index rate_limit_hits_window_idx on public.rate_limit_hits (window_start);

-- ---------------------------------------------------------------------------
-- Seguridad de tablas
-- ---------------------------------------------------------------------------

alter table public.likes enable row level security;
alter table public.rate_limit_hits enable row level security;

revoke all on table public.likes from public, anon, authenticated;
revoke all on table public.rate_limit_hits from public, anon, authenticated;

-- Permisos explícitos para el Worker, sin depender de los privilegios por defecto del proyecto.
grant select, insert, delete on table public.likes to service_role;
grant select, insert, update on table public.rate_limit_hits to service_role;

-- ---------------------------------------------------------------------------
-- Límite de frecuencia atómico (solo service_role)
-- ---------------------------------------------------------------------------

create or replace function public.consume_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window timestamptz;
  v_hits integer;
begin
  if p_key is null or char_length(p_key) < 1 or char_length(p_key) > 200
     or p_limit < 1 or p_window_seconds < 1 or p_window_seconds > 86400 then
    raise exception 'invalid_arguments' using errcode = '22023';
  end if;

  v_window := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);

  insert into public.rate_limit_hits as h (bucket_key, window_start, hits)
  values (p_key, v_window, 1)
  on conflict (bucket_key, window_start)
  do update set hits = h.hits + 1
  returning h.hits into v_hits;

  return v_hits <= p_limit;
end;
$$;

revoke all on function public.consume_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, integer, integer) to service_role;

-- Limpieza de ventanas antiguas (solo service_role; pensada para ejecutarse periódicamente).
create or replace function public.purge_rate_limit_hits()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deleted integer;
begin
  delete from public.rate_limit_hits
  where window_start < now() - interval '2 days';
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke all on function public.purge_rate_limit_hits() from public, anon, authenticated;
grant execute on function public.purge_rate_limit_hits() to service_role;

-- ---------------------------------------------------------------------------
-- Lectura pública de agregados
-- ---------------------------------------------------------------------------

create or replace function public.get_like_count(p_slug text)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer
  from public.likes as l
  where l.project_slug = p_slug;
$$;

revoke all on function public.get_like_count(text) from public;
grant execute on function public.get_like_count(text) to anon, authenticated, service_role;

create or replace function public.get_project_rankings()
returns table (project_slug text, likes_count integer)
language sql
stable
security definer
set search_path = ''
as $$
  select l.project_slug, count(*)::integer as likes_count
  from public.likes as l
  group by l.project_slug
  order by count(*) desc, l.project_slug
  limit 500;
$$;

revoke all on function public.get_project_rankings() from public;
grant execute on function public.get_project_rankings() to anon, authenticated, service_role;
