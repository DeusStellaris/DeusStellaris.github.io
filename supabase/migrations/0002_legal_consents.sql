-- 0002: registro de consentimientos (términos, privacidad y preferencia de publicidad).
--
-- Principios:
--  * Registro INMUTABLE: un trigger impide UPDATE y DELETE, incluso para service_role. Un cambio
--    de decisión se registra como un nuevo evento, nunca reescribiendo el histórico.
--  * La hora (accepted_at) la asigna la base de datos (now(), UTC). El cliente no la envía.
--  * RLS activado y sin políticas: anon y authenticated no leen ni escriben.
--  * Solo service_role inserta y lee (el Worker de la API).
--  * No se guardan nombre, correo ni IP. El identificador de sesión llega como hash HMAC.

create table public.legal_consents (
  id               uuid primary key default gen_random_uuid(),
  consent_type     text not null
    check (consent_type in ('terms', 'privacy', 'cookies_ads')),
  granted          boolean not null,
  document_version text not null
    check (char_length(document_version) between 1 and 32 and document_version ~ '^[0-9A-Za-z.-]+$'),
  locale           text not null check (locale in ('es', 'en')),
  session_hash     text not null
    check (char_length(session_hash) = 64 and session_hash ~ '^[0-9a-f]{64}$'),
  accepted_at      timestamptz not null default now()
);

create index legal_consents_session_idx on public.legal_consents (session_hash, consent_type);
create index legal_consents_accepted_at_idx on public.legal_consents (accepted_at);

-- Inmutabilidad: cualquier UPDATE o DELETE falla, incluso con service_role.
create or replace function public.legal_consents_block_changes()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'legal_consents es inmutable: los cambios se registran como nuevos eventos'
    using errcode = '42501';
end;
$$;

create trigger legal_consents_immutable
  before update or delete on public.legal_consents
  for each row execute function public.legal_consents_block_changes();

alter table public.legal_consents enable row level security;

revoke all on table public.legal_consents from public, anon, authenticated;
grant select, insert on table public.legal_consents to service_role;
