# Etapa 2: DeusDeck, Hub, demos y cuentas

## Rutas y cómo probarlas

Con `npm run build && npm run preview` (http://localhost:4321/):

| Ruta (es / en)                                              | Qué es                                                                 |
| ----------------------------------------------------------- | ---------------------------------------------------------------------- |
| `/programas/deusdeck/` · `/en/programs/deusdeck/`           | Ficha del producto: funciones, descarga por SO, versiones y legales    |
| `/programas/deusdeck/hub/` · `/en/programs/deusdeck/hub/`   | DeusDeck Hub (a donde apunta el botón de la app de escritorio)         |
| `/programas/deusdeck/eula/` · `/en/programs/deusdeck/eula/` | EULA con cláusula AS-IS (borrador pendiente de revisión legal)         |
| `/juegos/demos/<slug>/` · `/en/games/demos/<slug>/`         | Reproductor Click-to-Play y reseñas; solo existen con demos publicadas |
| `/hub-resources.json`, `/demos-index.json`                  | Catálogo del Hub y slugs de demos (el Worker valida reseñas con este)  |

Programas destaca DeusDeck con una tarjeta. Las rutas de demo y las reseñas se prueban con `npm run test:e2e:content`, que usa una demo y una API simuladas (fixtures en `tests/fixtures/`) y siempre las deshace.

## Ficha de DeusDeck

- Datos en `src/config/deusdeck.json`: `releases[]` con notas es/en e instaladores. Un instalador en `null` deja su botón desactivado y con tooltip: **no se expone ningún binario**. Cuando exista uno, se carga la URL y el botón pasa a enlace.
- El sistema operativo se detecta en el navegador (`src/features/deusdeck/os-detect.ts`) y no se envía a ningún lado. Los instaladores `.msi` y `.exe` son para Windows; en otros sistemas se muestra un aviso.

## DeusDeck Hub

- Catálogo en `src/config/hub-resources.json` (hoy vacío: no hay datos de ejemplo). Cada recurso: `id`, `category` (`themes`, `icons`, `emoji`, `plugins`), `name` y `description` en es/en, `author`, `version`, `minAppVersion`, `previewUrl`, `downloadUrl`, `installable`.
- `previewUrl` y `downloadUrl` solo aceptan rutas del sitio o `https`. Los recursos mal formados se descartan.
- `installable: true` muestra «Instalar en DeusDeck», que abre `deusdeck://install?id=<id>`. La app de escritorio debe registrar ese protocolo.

## Demos jugables

- Agregar una demo: cargar su entrada en `src/config/demos.json` (forma en `src/services/demos.ts`) y colocar el juego en `public/demos/<slug>/index.html` con su portada.
- El juego corre en un `<iframe>` con `sandbox="allow-scripts allow-pointer-lock"` (sin `allow-same-origin`), `allow="fullscreen; gamepad"` y sin referrer. No se carga hasta pulsar «Jugar demo».
- Controles táctiles (`touchControls`): al tocarlos se envía al juego `postMessage({ type: 'deus-input', key, pressed })`. El juego debe escuchar ese mensaje y tratarlo como una tecla.
- La CSP del sitio permite iframes del mismo origen (`frame-src 'self'`).

## Reseñas reales (Zero Fake Reviews)

- Tabla `reviews` (migración `0004`): una reseña por visitante y demo, comentario de hasta 500 caracteres, sin `<` ni `>` ni caracteres de control. RLS sin políticas: solo el Worker accede.
- Worker: `GET /reviews?slug=` y `POST /reviews`. Valida origen, que la demo exista en `DEMOS_INDEX_URL`, puntuación 1-5, saneo del comentario y límites de frecuencia por IP y por visitante. El navegador pinta todo con `textContent`.
- No hay ninguna reseña sembrada. Sin API configurada (`apiBaseUrl: null`) la sección dice que las reseñas todavía no están disponibles.

## Cuentas con PBKDF2-SHA256 (apagadas)

- Migración `0005`: `accounts` (correo solo como HMAC, contraseña solo como hash PBKDF2-SHA256; un `CHECK` rechaza cualquier otro formato) y `profile_backups` (JSON de hasta 32 KB).
- Worker (`workers/api/src/accounts.js`): `register`, `login` (token firmado de una hora) y `backup` GET/PUT. Todo responde 404 salvo que `ACCOUNTS_ENABLED=true` y exista el secreto `ACCOUNT_TOKEN_SECRET` (32 caracteres o más). Parámetros OWASP (19 MiB, 2 iteraciones, 1 hilo); se pueden ajustar con `ARGON2_MEMORY_KIB` y `ARGON2_ITERATIONS`.
- PBKDF2 corre en código nativo (Web Crypto, 100.000 iteraciones) y entra en el plan gratuito de Workers.
- UI: `src/components/account/AccountPanel.astro`, incluida en el perfil solo si `src/config/services.json` tiene `accountsEnabled: true`. Hoy no está en el DOM.
- Decisión pendiente: al guardar el correo solo como HMAC no hay recuperación de contraseña por correo.

## Pendiente

- Aplicar las migraciones `0003` a `0005` en Supabase y ejecutar `supabase/tests/rls/rls.test.sql` (no se pudo correr aquí: no hay `psql` en esta máquina).
- Desplegar el Worker con `DEMOS_INDEX_URL` y cargar `apiBaseUrl`.
- Revisión legal: las reseñas (comentario y hash del visitante), las suscripciones push y las cuentas deben reflejarse en la política de privacidad antes de activarlas, y el EULA queda como borrador.
