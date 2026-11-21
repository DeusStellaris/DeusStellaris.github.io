# API de me gusta (Cloudflare Worker)

Recibe los "me gusta" de los visitantes y los guarda en Supabase. Es la única pieza que escribe en la base de datos. El navegador solo lee contadores agregados (ver `supabase/README.md`).

## Contrato

`POST /likes` con `Content-Type: application/json` y `Origin` de un sitio permitido:

```json
{ "slug": "mi-proyecto", "visitorId": "<UUID v4 anónimo>", "action": "like" }
```

Respuesta `200`:

```json
{ "slug": "mi-proyecto", "likes": 8, "liked": true }
```

| Estado | Cuándo                                                                                     |
| ------ | ------------------------------------------------------------------------------------------ |
| `400`  | Cuerpo no válido, demasiado grande, tipo de contenido incorrecto o campos fuera de formato |
| `403`  | `Origin` ausente o no permitido                                                            |
| `404`  | El slug no está publicado en el índice del sitio                                           |
| `405`  | Método distinto de POST u OPTIONS                                                          |
| `429`  | Límite de frecuencia alcanzado (con `Retry-After: 60`)                                     |
| `502`  | Fallo al guardar o leer en la base de datos (mensaje genérico)                             |
| `503`  | Configuración incompleta. No revela qué variable falta al cliente.                         |

## Defensas, en orden

1. **Origen**: solo `ALLOWED_ORIGINS`, comparado en forma canónica. Nada de CORS comodín.
2. **Cuerpo**: JSON, máximo 1 KB medido en bytes reales, validación de slug (`^[A-Za-z0-9][A-Za-z0-9_-]{0,119}$`), UUID v4 de visitante y acción `like` o `unlike`.
3. **Existencia**: el slug debe estar en el índice publicado del sitio (`SITE_INDEX_URL`), cacheado 10 minutos. Así no se puede registrar un like para un proyecto inventado.
4. **Frecuencia**: 30 peticiones por minuto por IP y 120 por hora por visitante, con la función SQL `consume_rate_limit`, que es atómica.
5. **Persistencia**: solo HMAC-SHA256 del visitante y de la IP, con un secreto del servidor (`VISITOR_HASH_PEPPER`). Nunca se guarda la IP ni el UUID en claro.

## Variables y secretos

| Nombre                      | Tipo                             | Dónde                                           |
| --------------------------- | -------------------------------- | ----------------------------------------------- |
| `ALLOWED_ORIGINS`           | público                          | `wrangler.toml`                                 |
| `SITE_INDEX_URL`            | público                          | `wrangler.toml`                                 |
| `SUPABASE_URL`              | público                          | `wrangler.toml` (vacío hasta crear el proyecto) |
| `SUPABASE_SERVICE_ROLE_KEY` | **secreto**                      | `wrangler secret put`                           |
| `VISITOR_HASH_PEPPER`       | **secreto**, 32 caracteres o más | `wrangler secret put`                           |

Generar el pepper sin imprimirlo: `openssl rand -base64 48 | npx wrangler@4.151.3 secret put VISITOR_HASH_PEPPER`.

`SUPABASE_SERVICE_ROLE_KEY` nunca debe aparecer en el navegador, en el repositorio ni en una respuesta. El Worker la usa solo en el servidor.

## Procedimiento

Desde `workers/api/`, con Wrangler **4.151.3**:

1. Crear el proyecto de Supabase (lo haces tú) y aplicar la migración `supabase/migrations/0001_likes_and_rankings.sql` (ver `supabase/README.md`).
2. Copiar la URL del proyecto en `wrangler.toml` → `SUPABASE_URL`.
3. Registrar los secretos:

   ```
   npx wrangler@4.151.3 secret put SUPABASE_SERVICE_ROLE_KEY
   openssl rand -base64 48 | npx wrangler@4.151.3 secret put VISITOR_HASH_PEPPER
   ```
4. Desplegar: `npx wrangler@4.151.3 deploy`. Anota la URL `https://deus-likes-api.<subdominio>.workers.dev`.
5. En `src/config/services.json`, poner esa URL en `apiBaseUrl` (sin barra final). Al compilar, la CSP del sitio permitirá solo ese origen en `connect-src`.
6. Publicar el sitio.

## Prueba

```
npm test
```

Cubren: CORS exacto, origen no permitido, validación del cuerpo, límite de tamaño, slug no publicado, like y unlike con hash del visitante (nunca el UUID en claro), límites de frecuencia, fallos de la base de datos sin detalles, configuración incompleta y orígenes mal formados.

Prueba de humo en producción (desde un origen permitido en el navegador, o con cabecera Origin en curl):

```
curl -s -X POST https://<worker>/likes \
  -H "Origin: https://DeusStellaris.github.io" -H "Content-Type: application/json" \
  -d '{"slug":"<proyecto-publicado>","visitorId":"3f2c9a8e-1b4d-4c7e-9f0a-2d6e8b7c5a14","action":"like"}'
```

Debe responder `200` con el contador. Repite con `Origin: https://evil.example` y debe responder `403`.

## Límites conocidos

- El límite por IP usa `CF-Connecting-IP`. Los límites de una sola instancia no son globales: la base de datos sí los aplica de forma compartida.
- Sin CAPTCHA. Si aparece abuso sostenido, activar Cloudflare Turnstile delante de `/likes` (requiere cambiar el cliente).
- Un visitante que borra su almacenamiento local obtiene un nuevo identificador y puede volver a dar like. Es una limitación aceptada de un sistema sin cuentas.

## Reseñas y cuentas (Etapa 2)

Detalle completo en `docs/setup/etapa2-deusdeck.md`.

| Ruta                                          | Qué hace                                                                     |
| --------------------------------------------- | ---------------------------------------------------------------------------- |
| `GET /reviews?slug=` · `POST /reviews`        | Reseñas reales de demos. Exige `DEMOS_INDEX_URL` (público, `wrangler.toml`). |
| `POST /accounts/register` · `/accounts/login` | Cuentas con PBKDF2-SHA256. Apagadas: 404 salvo `ACCOUNTS_ENABLED=true`.      |
| `GET` · `PUT /accounts/backup`                | Respaldo del perfil (JSON de hasta 32 KB) con token de sesión.               |
