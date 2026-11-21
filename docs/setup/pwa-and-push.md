# PWA y notificaciones push

## PWA

- `src/pages/manifest.webmanifest.ts` genera el manifiesto (nombre "Deus", `standalone`, fondo `#0B0914`, tema `#7C3AED`) respetando `basePath`.
- `src/pages/sw.js.ts` publica `src/pwa/service-worker.js` en la raíz de la ruta base. Estrategias: HTML red primero (con copia de lo visitado y, si no hay, `/offline/` o `/en/offline/`), assets de `/_astro/` y `/assets/` caché primero, el resto del mismo origen (p. ej. `search-index.json`) caché con revalidación, y red estricta —sin interceptar— para `/auth`, `/push`, `/consent`, `/accounts`, `/api`, `/admin/` y todo otro origen (el Worker de API). Al instalarse guarda inicio, páginas sin conexión, índice de búsqueda, logo y los CSS/JS/fuentes que declaran esas páginas; el caché es versionado por build.
- Instalación: `src/features/pwa/install.ts` captura `beforeinstallprompt` y muestra el botón del perfil; en iOS Safari muestra la nota con los pasos manuales.
- Íconos: `npm run icons` (scripts/generate-icons.mjs) los regenera desde el original de `_Deus_Assets/brand-sources/`.
- Íconos en `public/assets/icons/` (192, 512, maskable 512 y apple-touch), derivados del logotipo original que vive en `_Deus_Assets/brand-sources/`.
- El registro (`src/features/pwa/register.ts`) solo corre en producción: no funciona con `npm run dev`.

### Probar en localhost

1. `npm run build && npm run preview` y abrir `http://localhost:4321/` (localhost cuenta como origen seguro).
2. DevTools → Application → Manifest (comprobar íconos e "Installable") y Service Workers (estado "activated").
3. Instalar desde el ícono de la barra de direcciones. Para el modo sin conexión: visitar una página, marcar Offline en Network y recargarla.

## Notificaciones push

Cliente: botón de campana en el encabezado → panel `NotificationsDialog.astro` (Todo, Nada, Por categoría, Por proyecto; los proyectos salen de `src/config/push.json` más los publicados, e incluyen `deusdeck`). Las preferencias se guardan en `localStorage` (`deus:push-preferences`) y, con suscripción activa, se sincronizan con el Worker.

Servidor: `workers/api` expone `POST /push/subscribe` y `POST /push/unsubscribe` (tabla `push_subscriptions`, migración `supabase/migrations/0003_push_subscriptions.sql`).

### Activarlas de punta a punta

1. Generar claves VAPID: `npx web-push generate-vapid-keys` (no se versionan).
2. Clave pública → `PUBLIC_VAPID_PUBLIC_KEY` en `.env` y en el entorno del build.
3. Clave privada → secreto del Worker que envíe los avisos, nunca en el repositorio.
4. Aplicar la migración 0003 y desplegar el Worker con `apiBaseUrl` cargado en `src/config/services.json`.

Sin esos valores el panel funciona igual: guarda las preferencias en el dispositivo y avisa que el servicio no está disponible.

### Pendiente

- El **envío** de avisos (firma VAPID y cifrado del payload) no está implementado: hoy se registran suscripciones y preferencias. La selección de destinatarios usa `mode`, `categories` y `projects` de la tabla.
- Los documentos legales no mencionan todavía las suscripciones push (endpoint y claves de cifrado). Requiere revisión legal y subir la versión en `src/config/legal.json`.
- iOS: solo funciona con la app instalada en la pantalla de inicio (el panel lo avisa en español e inglés).
