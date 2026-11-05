# Worker de autenticación para Decap CMS

Worker de Cloudflare que permite a Decap CMS iniciar sesión con GitHub desde `/admin/` del portafolio. El sitio está en GitHub Pages, que es estático, así que el intercambio OAuth tiene que ejecutarse en un servicio propio.

## Cómo funciona el flujo

Decap 3.17.1 no usa PKCE con GitHub: su login de GitHub es un **popup** que habla con un servicio OAuth compatible con Netlify. Este Worker es ese servicio, y añade PKCE por su cuenta:

1. Decap abre un popup en `https://<worker>/auth?provider=github&scope=repo&site_id=…`.
2. `/auth` valida el origen (cabecera `Referer`), genera un `state` y un `code_verifier` aleatorios, y guarda ambos en una cookie **cifrada** (AES-256-GCM) `__Host-deus_decap_oauth`: `HttpOnly`, `Secure`, `SameSite=Lax`, con caducidad de 5 minutos. Redirige a `github.com/login/oauth/authorize` con `client_id`, `redirect_uri = https://<worker>/callback`, `state` y `code_challenge` (S256).
3. GitHub devuelve el usuario a `https://<worker>/callback?code=…&state=…`.
4. `/callback` descifra la cookie, comprueba su antigüedad, compara el `state` en tiempo constante, y canjea el `code` en `github.com/login/oauth/access_token` enviando el `client_secret` y el `code_verifier`. El secreto nunca sale del Worker.
5. La página de respuesta entrega el token a Decap con `postMessage`, pero **solo** si el origen que responde al saludo está en la lista permitida (`https://deusstellaris.github.io`, o `http://localhost:4321` en desarrollo).

## URLs exactas de la OAuth App de GitHub

La **Authorization callback URL es el Worker**, no `/admin/`. GitHub redirige al Worker, y el Worker devuelve el token a Decap por popup. `/admin/` nunca recibe el `code` de GitHub.

Hace falta **una OAuth App por entorno**, porque cada una tiene su propio `client_id` y `client_secret`.

### Aplicación de producción

| Campo de GitHub            | Valor                                                    |
| -------------------------- | -------------------------------------------------------- |
| Application name           | `Deus CMS (producción)`                                  |
| Homepage URL               | `https://DeusStellaris.github.io`                        |
| Application description    | (opcional) `Panel de administración del portafolio Deus` |
| Authorization callback URL | `https://<worker>/callback`                              |
| Enable Device Flow         | desactivado                                              |

Donde `<worker>` es el host del Worker tal como lo imprime `wrangler deploy`, por ejemplo `deus-decap-auth.<subdominio-de-cuenta>.workers.dev`. Se conoce **después** del primer despliegue, así que el orden es el de la sección siguiente.

### Aplicación de desarrollo (opcional, solo para probar en local)

| Campo de GitHub            | Valor                            |
| -------------------------- | -------------------------------- |
| Application name           | `Deus CMS (desarrollo)`          |
| Homepage URL               | `http://localhost:4321`          |
| Authorization callback URL | `http://localhost:8787/callback` |

`http://localhost:8787` es el puerto por defecto de `wrangler dev`, y `http://localhost:4321` el de `astro dev`. Si cambias un puerto, cambia también aquí.

Ninguna de estas URLs contiene secretos. Los secretos aparecen una sola vez en GitHub, al generar el _client secret_; cópialo y guárdalo en tu gestor de contraseñas. No lo pegues en el repositorio ni en el chat.

## Variables y secretos

| Nombre                      | Tipo               | Dónde se define                                      | Descripción                                                          |
| --------------------------- | ------------------ | ---------------------------------------------------- | -------------------------------------------------------------------- |
| `GITHUB_CLIENT_ID_PROD`     | público            | `wrangler.toml` → `[vars]`                           | Client ID de la app de producción                                    |
| `DEV_OAUTH_ENABLED`         | público            | `wrangler.toml` (`"false"`) y `.dev.vars` (`"true"`) | Activa el origen de desarrollo. **Nunca `"true"` en producción.**    |
| `GITHUB_CLIENT_ID_DEV`      | público            | `.dev.vars`                                          | Client ID de la app de desarrollo                                    |
| `GITHUB_CLIENT_SECRET_PROD` | **secreto**        | `wrangler secret put`                                | Client secret de producción                                          |
| `GITHUB_CLIENT_SECRET_DEV`  | **secreto**        | `.dev.vars` (local)                                  | Client secret de desarrollo                                          |
| `OAUTH_STATE_KEY`           | **secreto**        | `wrangler secret put`                                | Clave AES-256 de 32 bytes en base64. Cifra la cookie de transacción. |
| `AUTH_RATE_LIMITER`         | binding (opcional) | `wrangler.toml`                                      | Ver "Límite de frecuencia"                                           |

Ni `client_secret` ni `OAUTH_STATE_KEY` aparecen en `config.yml`, en el bundle del sitio ni en el HTML que se sirve al navegador.

## Procedimiento de configuración (producción)

Todos los comandos se ejecutan desde `workers/decap-auth/`. Se usa Wrangler **4.151.3**, la versión publicada hace más de dos semanas.

1. **Instalar dependencias y entrar en la cuenta de Cloudflare:**

   ```
   npm install
   npx wrangler@4.151.3 login
   ```

2. **Generar la clave de cifrado del estado y guardarla como secreto** (no la imprimas ni la copies a ningún archivo):

   ```
   openssl rand -base64 32 | npx wrangler@4.151.3 secret put OAUTH_STATE_KEY
   ```

3. **Primer despliegue** (todavía sin credenciales de GitHub: el Worker responde 503 de forma controlada):

   ```
   npx wrangler@4.151.3 deploy
   ```

   Anota la URL que imprime, `https://deus-decap-auth.<subdominio>.workers.dev`.

4. **Crear la OAuth App de producción** en GitHub (Settings → Developer settings → OAuth Apps → New OAuth App) con los valores de la tabla anterior. Usa la URL del paso 3 para `https://<worker>/callback`.

5. **Registrar las credenciales:**
   - En `wrangler.toml`, `GITHUB_CLIENT_ID_PROD = "<client id copiado de GitHub>"`. El client ID es público.
   - Secreto del client secret:

     ```
     npx wrangler@4.151.3 secret put GITHUB_CLIENT_SECRET_PROD
     ```

     Wrangler pide el valor por la entrada estándar; no lo escribas en la línea de comandos.

6. **Desplegar de nuevo** para que tome las variables:

   ```
   npx wrangler@4.151.3 deploy
   ```

7. **Apuntar Decap a este Worker.** En `public/admin/config.yml`, reemplaza el marcador por la URL real, sin barra final:

   ```yaml
   backend:
     name: github
     repo: DeusStellaris/DeusStellaris.github.io
     branch: main
     base_url: https://deus-decap-auth.<subdominio>.workers.dev
     auth_endpoint: auth
   ```

   Retira `auth_type: pkce`: no aplica a GitHub en Decap 3.17.1 y puede inducir a error. Después de cambiar `config.yml`, actualiza también `connect-src` en `public/admin/index.html` si hiciera falta.

8. **Publicar el sitio** (`npm run ci` y luego el despliegue de GitHub Pages).

## Prueba en producción

1. Desde un navegador, abre `https://DeusStellaris.github.io/admin/`, pulsa _Login with GitHub_ y acepta el permiso `repo`.
2. Debe abrirse un popup de GitHub, luego la ventana se cierra y el panel carga tu usuario.
3. Comprobación rápida desde terminal:

   ```
   curl -sI "https://<worker>/auth?provider=github&scope=repo" -H "Referer: https://DeusStellaris.github.io/admin/"
   ```

   Debe responder `302` con `location: https://github.com/login/oauth/authorize?…` y una cabecera `set-cookie` que empiece por `__Host-deus_decap_oauth=`.
4. `curl -s "https://<worker>/callback?code=x&state=y"` debe responder `400` con «La autorización venció…» (no hay cookie). Eso confirma que la validación de estado está activa.

## Prueba en local

1. Crea la OAuth App de desarrollo (tabla de arriba) y copia `.dev.vars.example` a `.dev.vars`. Rellena `GITHUB_CLIENT_ID_DEV`, `GITHUB_CLIENT_SECRET_DEV` y `OAUTH_STATE_KEY` (usa un valor distinto del de producción). `.dev.vars` está en `.gitignore`.
2. En una terminal, arranca el Worker local: `npm run dev` (queda en `http://localhost:8787`).
3. En otra terminal, en la raíz del sitio: `npm run sync:decap` y `npx astro dev` (queda en `http://localhost:4321`).
4. **Solo para esta prueba**, cambia temporalmente `base_url` en `public/admin/config.yml` a `http://localhost:8787`. **Revierte el cambio antes de cualquier commit**; no debe quedar en el repositorio.
5. Abre `http://localhost:4321/admin/` e inicia sesión.

## Pruebas automáticas

```
npm test
```

Cubren: vector oficial de PKCE (RFC 7636), cifrado y manipulación de la cookie, validación de parámetros, caducidad de la transacción, rechazo de orígenes y de state incorrectos, que el `code_verifier` enviado corresponde al `code_challenge` inicial, y que un fallo del canje no filtra detalles ni el token.

## Límite de frecuencia

El Worker acepta un binding opcional `AUTH_RATE_LIMITER` (límite por IP). Como **recomendación independiente del código**, configura también una regla de WAF en el panel de Cloudflare: Security → WAF → Rate limiting rules, con ruta `/auth` y `/callback`, límite de 10 peticiones por minuto por IP y acción de bloqueo. La ubicación exacta de los menús puede cambiar; verifícala en la documentación de Cloudflare.

## Decisiones de seguridad y límites conocidos

- **Sin sesión en el Worker.** Toda la transacción vive en una cookie cifrada de 5 minutos. El Worker no guarda estado propio ni necesita almacenamiento.
- **CSRF.** `/callback` solo acepta la transacción que tiene la cookie y el `state` coincidente. El canje no usa credenciales ambientales (no hay cookies de sesión), así que CSRF no aplica ahí.
- **Origen del token.** El token solo se entrega a un origen de la lista, comprobado con `event.origin` del navegador, no con datos de la petición.
- **Cabeceras.** `Cache-Control: no-store`, `Referrer-Policy: no-referrer`, CSP sin `unsafe-*` (la página que entrega el token usa un nonce por respuesta). No se envía COOP, porque Decap necesita `window.opener`.
- **Token en el navegador.** Decap guarda el token de GitHub en el almacenamiento local del navegador del editor. Cualquier fallo de XSS en `/admin/` lo expondría, por eso la CSP de `/admin/` y la ausencia de HTML crudo en el contenido son medidas críticas.
- **PKCE y GitHub.** El `code_challenge` se envía a GitHub. Que GitHub lo verifique depende de su soporte para OAuth Apps, que no he comprobado. El `client_secret` sigue siendo obligatorio en el canje, así que un código interceptado no se puede canjear sin él.
- **Selección de app por Referer.** Sin `Referer` se usa producción. Un `Referer` de otro origen se rechaza. El `Referer` solo elige qué OAuth App usar; no decide a quién se entrega el token.
