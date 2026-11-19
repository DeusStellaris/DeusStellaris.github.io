-- 0003: suscripciones de notificaciones push con preferencias granulares.
--
-- Principios:
--  * Una fila por suscripción del navegador. La clave primaria es un HMAC del endpoint, así el
--    Worker hace upsert sin comparar el endpoint en claro.
--  * El endpoint y las claves de cifrado (p256dh, auth) se guardan porque son imprescindibles para
--    enviar el aviso. Es un dato sensible: RLS activado y sin políticas, solo service_role accede.
--  * No hay nombre, correo ni IP. Darse de baja borra la fila: no existe un modo "nada" guardado.
--  * Las categorías y los proyectos (slugs) solo se usan cuando el modo lo pide.

create table public.push_subscriptions (
  endpoint_hash text primary key
    check (char_length(endpoint_hash) = 64 and endpoint_hash ~ '^[0-9a-f]{64}$'),
  endpoint      text not null
    check (char_length(endpoint) between 20 and 512 and endpoint ~ '^https://'),
  p256dh        text not null check (p256dh ~ '^[A-Za-z0-9_-]{87}$'),
  auth          text not null check (auth ~ '^[A-Za-z0-9_-]{22}$'),
  mode          text not null check (mode in ('all', 'categories', 'projects')),
  categories    text[] not null default '{}'
    check (categories <@ array['games', 'programs', 'freelance']::text[]),
  projects      text[] not null default '{}'
    check (
      cardinality(projects) <= 50
      and array_to_string(projects, ',') ~ '^([A-Za-z0-9][A-Za-z0-9_-]{0,119}(,|$))*$'
    ),
  locale        text not null check (locale in ('es', 'en')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Consultas del futuro envío: por modo y por categoría o proyecto.
create index push_subscriptions_mode_idx on public.push_subscriptions (mode);
create index push_subscriptions_categories_idx on public.push_subscriptions using gin (categories);
create index push_subscriptions_projects_idx on public.push_subscriptions using gin (projects);

create or replace function public.push_subscriptions_touch()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger push_subscriptions_touch_updated_at
  before update on public.push_subscriptions
  for each row execute function public.push_subscriptions_touch();

alter table public.push_subscriptions enable row level security;

revoke all on table public.push_subscriptions from public, anon, authenticated;
grant select, insert, update, delete on table public.push_subscriptions to service_role;
