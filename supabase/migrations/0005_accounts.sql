-- 0005: base de cuentas opcionales y respaldo del perfil en la nube (apagada hasta el lanzamiento).
--
-- Principios (Privacy by Design):
--  * La contraseña solo existe como hash Argon2id en formato PHC. Un CHECK rechaza cualquier valor
--    que no tenga esa forma, así un texto plano jamás se guarda aunque el Worker fallara.
--  * El correo solo existe como HMAC (email_hash): no hay lista de correos que filtrar.
--  * El respaldo es un JSON pequeño (favoritos y preferencias), con tope de tamaño.
--  * RLS activado y sin políticas: solo service_role (el Worker) accede.
--  * Borrar la cuenta borra su respaldo (on delete cascade).

create table public.accounts (
  id            uuid primary key default gen_random_uuid(),
  email_hash    text not null unique check (email_hash ~ '^[0-9a-f]{64}$'),
  password_hash text not null
    check (password_hash ~ '^\$argon2id\$v=19\$m=[0-9]+,t=[0-9]+,p=[0-9]+\$[A-Za-z0-9+/]+\$[A-Za-z0-9+/]+$'),
  created_at    timestamptz not null default now()
);

create table public.profile_backups (
  account_id uuid primary key references public.accounts (id) on delete cascade,
  payload    jsonb not null
    check (jsonb_typeof(payload) = 'object' and pg_column_size(payload) <= 32768),
  updated_at timestamptz not null default now()
);

create trigger profile_backups_touch_updated_at
  before update on public.profile_backups
  for each row execute function public.touch_updated_at();

alter table public.accounts enable row level security;
alter table public.profile_backups enable row level security;

revoke all on table public.accounts, public.profile_backups from public, anon, authenticated;
grant select, insert, delete on table public.accounts to service_role;
grant select, insert, update, delete on table public.profile_backups to service_role;
