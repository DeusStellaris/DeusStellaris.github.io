# Configuración externa pendiente

Ningún valor de esta lista está inventado. Los placeholders del proyecto son `null` y están en `src/config/*.json`.

## GitHub Pages

1. Repositorio: `DeusStellaris/DeusStellaris.github.io` (sitio de usuario, ruta base `/`).
2. Settings → Pages → Source: **GitHub Actions**. El workflow de despliegue se añade en la Fase 8.
3. El sitio queda en `https://DeusStellaris.github.io`, configurado en `src/config/site.json`.
4. Para un dominio propio: cambiar `url` en `src/config/site.json` y añadir el `CNAME` en `public/`. No hace falta tocar otros archivos.

## Cloudflare Worker (autenticación de Decap y API)

Pendiente: autenticación en la Fase 4 y API en la Fase 5.

- **Worker de autenticación** para Decap (`workers/decap-auth/`, PKCE con GitHub). Secretos: `GITHUB_CLIENT_SECRET_PROD` y `OAUTH_STATE_KEY`, cargados con `wrangler secret put`. El client ID de producción va en `wrangler.toml`. Nunca en el repositorio ni en el cliente. Procedimiento completo y URLs de la OAuth App en `workers/decap-auth/README.md`.
- **Worker de la API** de likes y consentimientos. Secretos: `SUPABASE_SERVICE_ROLE_KEY` y `VISITOR_HASH_PEPPER`.
- Al desplegarlo, su URL pública va en `src/config/services.json` → `apiBaseUrl`.

## Supabase

1. Crear el proyecto y copiar la URL y la clave `anon`.
2. Desarrollo: copiar `.env.example` a `.env` y completar `PUBLIC_SUPABASE_URL` y `PUBLIC_SUPABASE_ANON_KEY`.
3. Producción: definir las mismas variables como secretos del workflow de build.
4. `service_role` **solo** en los secretos del Worker. Nunca en `.env` del sitio ni en el build.

## Giscus

1. En `DeusStellaris/DeusStellaris.github.io`: Settings → General → Features → activar **Discussions**.
2. Crear la categoría de discusiones que se usará para los comentarios.
3. En giscus.app, obtener `repoId` y `categoryId`.
4. Completar `src/config/giscus.json` y poner `enabled: true` (Fase 5).

## AdSense

Pendiente de cuenta aprobada. Completar `publisherId` en `src/config/ads.json` y poner `enabled: true` solo cuando exista la cuenta. No se inventa ningún identificador.

## Decap CMS

Pendiente de la configuración del Worker de autenticación. Ver `docs/setup/decap-cms.md` para el procedimiento completo y los pasos concretos (OAuth App, secretos del Worker y sustitución de `base_url`).
