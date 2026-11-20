# Despliegue en Cloudflare Pages + Workers

Guía para quien nunca usó Cloudflare. El sitio (Astro estático) va a **Pages**; las dos APIs (`workers/api` y `workers/decap-auth`) van a **Workers**; la base de datos vive en **Supabase**. No hace falta ninguna variable en un archivo del repositorio: los valores privados se cargan solo en los paneles.

Orden recomendado: Supabase → Workers → Pages → ajustar URLs → prueba de carga.

## 1. Supabase (base de datos)

1. Creá un proyecto en <https://supabase.com> y guardá la **URL del proyecto**, la clave **anon** y la clave **service_role** (esta última es secreta).
2. Aplicá las migraciones **en orden**, de `0001` a `0006` (carpeta `supabase/migrations/`):
   - **Desde el panel**: _SQL Editor_ → _New query_ → pegá el contenido de cada archivo → _Run_. Una por una, sin saltear ninguna.
   - **Con la CLI**: `npx supabase@<version> link --project-ref <ref>` y después `npx supabase@<version> db push` (aplica todas las pendientes en orden).
3. La `0006` (`0006_performance_indexes.sql`) crea índices y elimina `likes_project_slug_idx`; usa `if not exists` / `if exists`, así que repetirla no rompe nada. Necesita que `0001`, `0003` y `0004` ya estén aplicadas. Las `0001`–`0005` **no** se pueden repetir (crean tablas): si fallan por "already exists", ya estaban aplicadas.
4. Comprobación: en _Table Editor_ tienen que verse `likes`, `legal_consents`, `push_subscriptions`, `reviews` y las tablas de cuentas.

## 2. Workers

Desde `workers/api/` y `workers/decap-auth/`, con tu cuenta de Cloudflare (`npx wrangler@4.151.3 login` una vez):

```
npx wrangler@4.151.3 deploy
```

### Worker `deus-likes-api` (`workers/api`)

Variables públicas (van en `wrangler.toml`, sección `[vars]`):

| Nombre              | Valor                                                                  |
| ------------------- | ---------------------------------------------------------------------- |
| `ALLOWED_ORIGINS`   | Origen del sitio en Pages, p. ej. `https://tu-proyecto.pages.dev`      |
| `SITE_INDEX_URL`    | `https://tu-proyecto.pages.dev/search-index.json`                      |
| `DEMOS_INDEX_URL`   | `https://tu-proyecto.pages.dev/demos-index.json`                       |
| `SUPABASE_URL`      | URL del proyecto de Supabase                                           |
| `ACCOUNTS_ENABLED`  | `true` solo si querés cuentas; sin definir, `/accounts/*` responde 404 |
| `ARGON2_MEMORY_KIB` | Opcional, ajuste de Argon2id                                           |
| `ARGON2_ITERATIONS` | Opcional, ajuste de Argon2id                                           |

Secretos (se cargan con `npx wrangler@4.151.3 secret put NOMBRE`, o en el panel: _Workers & Pages_ → el Worker → _Settings_ → _Variables and Secrets_ → _Secret_):

| Nombre                      | Detalle                                        |
| --------------------------- | ---------------------------------------------- |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave `service_role` de Supabase               |
| `VISITOR_HASH_PEPPER`       | 32 caracteres o más: `openssl rand -base64 48` |
| `ACCOUNT_TOKEN_SECRET`      | 32 caracteres o más: `openssl rand -base64 48` |

### Worker `deus-decap-auth` (`workers/decap-auth`)

| Nombre                      | Tipo    | Detalle                                                  |
| --------------------------- | ------- | -------------------------------------------------------- |
| `GITHUB_CLIENT_ID_PROD`     | público | Client ID de la OAuth App de GitHub (en `wrangler.toml`) |
| `DEV_OAUTH_ENABLED`         | público | Dejar en `"false"` en producción                         |
| `GITHUB_CLIENT_SECRET_PROD` | secreto | Client secret de la OAuth App                            |
| `OAUTH_STATE_KEY`           | secreto | `openssl rand -base64 32`                                |
| `AUTH_RATE_LIMITER`         | binding | Opcional; ver `workers/decap-auth/README.md`             |

`GITHUB_CLIENT_ID_DEV` y `GITHUB_CLIENT_SECRET_DEV` son solo para `.dev.vars` local: no se cargan en producción.

Al terminar, cada Worker queda en `https://<nombre>.<tu-subdominio>.workers.dev`.

## 3. Pages (el sitio)

1. En <https://dash.cloudflare.com> → _Workers & Pages_ → _Create_ → _Pages_ → _Connect to Git_ → autorizá GitHub y elegí el repositorio.
2. Configuración de build:
   - **Framework preset**: Astro (o _None_).
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: vacío (raíz del repositorio).
3. En _Settings_ → _Variables and Secrets_ (entorno _Production_) cargá:

| Nombre                     | Tipo    | Detalle                                                  |
| -------------------------- | ------- | -------------------------------------------------------- |
| `NODE_VERSION`             | texto   | `22` (el proyecto exige Node 22.23.4 o superior)         |
| `PUBLIC_SUPABASE_URL`      | público | URL del proyecto de Supabase                             |
| `PUBLIC_SUPABASE_ANON_KEY` | público | Clave `anon` (la protege RLS; nunca la `service_role`)   |
| `PUBLIC_VAPID_PUBLIC_KEY`  | público | Clave VAPID pública (`npx web-push generate-vapid-keys`) |

4. _Save and Deploy_. Las cabeceras de seguridad y de caché salen de `public/_headers`, que Pages aplica solo.

## 4. Ajustar las URLs al dominio real

Una vez que Pages te da la URL (`https://tu-proyecto.pages.dev` o tu dominio propio), actualizá y volvé a desplegar:

- `src/config/site.json` → `url` (hoy apunta a GitHub Pages).
- `src/config/services.json` → `apiBaseUrl` con la URL de `deus-likes-api`.
- `workers/api/wrangler.toml` → `ALLOWED_ORIGINS`, `SITE_INDEX_URL`, `DEMOS_INDEX_URL`.
- OAuth App de GitHub → callback `https://<worker-decap>/callback`.

## 5. Prueba de carga (opcional, k6)

Instalá k6 (`winget install k6`) y corré contra el sitio ya desplegado:

```
k6 run -e TARGET_URL=https://tu-proyecto.pages.dev -e API_URL=https://deus-likes-api.<subdominio>.workers.dev tests/load/smoke.js
```

Sube a 25 usuarios durante 60 s, exige p(95) < 500 ms, cabeceras de seguridad y caché, y confirma el 429 del Worker. Sin `API_URL` se omite la parte de 429. No envía correos ni notificaciones.
