/*
 * Service Worker de Deus. Plantilla: src/pages/sw.js.ts sustituye la versión y la ruta base al construir.
 *
 * ESTRATEGIAS.
 * - Documentos HTML: red primero; cada página visitada se guarda. Sin red: la copia guardada y, si no
 *   existe, la página /offline/ (o /en/offline/).
 * - Assets estáticos (/_astro/ con hash, /assets/): caché primero. La versión del caché cambia en cada
 *   build, así que nunca sirven contenido viejo.
 * - Otros recursos del mismo origen (p. ej. search-index.json): caché con revalidación en segundo plano.
 * - Red estricta, sin tocar: API (/auth, /push, /consent, /accounts, /api), otros orígenes (el Worker
 *   vive en otro dominio), métodos distintos de GET y el panel /admin/.
 *
 * SHELL. Al instalarse se guardan las páginas de inicio, las de sin conexión, el índice de búsqueda, el
 * logo y los CSS, JS y fuentes que esas páginas declaran.
 *
 * NOTIFICACIONES PUSH.
 * El payload es JSON { title, body, url, tag }. Solo se abren URLs del mismo origen.
 */

const VERSION = '__VERSION__';
const BASE = '__BASE__';
const CACHE = `deus-${VERSION}`;
const OFFLINE_PAGES = [`${BASE}offline/`, `${BASE}en/offline/`];
const SHELL_PAGES = [BASE, `${BASE}en/`, ...OFFLINE_PAGES];
const PRECACHE = [
  ...SHELL_PAGES,
  `${BASE}manifest.webmanifest`,
  `${BASE}search-index.json`,
  `${BASE}favicon.svg`,
  `${BASE}assets/logo/deus-samurai.webp`,
  `${BASE}assets/icons/icon-192.png`,
];
const NOTIFICATION_ICON = `${BASE}assets/icons/icon-192.png`;
const NETWORK_ONLY = ['auth/', 'push/', 'consent', 'accounts/', 'api/', 'admin/'].map(
  (path) => `${BASE}${path}`,
);
const STATIC_PREFIXES = [`${BASE}_astro/`, `${BASE}assets/`];
const ASSET_PATTERN = /(?:href|src)="([^"]*\/_astro\/[^"]+\.(?:css|js|woff2?))"/g;

/** Guarda una URL sin romper la instalación si una falla (p. ej. un recurso opcional). */
async function put(cache, url) {
  try {
    const response = await fetch(url, { cache: 'reload' });
    if (response.ok) await cache.put(url, response.clone());
    return response;
  } catch {
    return undefined;
  }
}

/** Guarda las páginas del shell y los assets con hash que declaran sus HTML. */
async function precacheShell() {
  const cache = await caches.open(CACHE);
  const assets = new Set();
  for (const url of PRECACHE) {
    const response = await put(cache, url);
    if (response && SHELL_PAGES.includes(url)) {
      const html = await response.clone().text();
      for (const match of html.matchAll(ASSET_PATTERN)) assets.add(match[1]);
    }
  }
  await Promise.all([...assets].map((asset) => put(cache, asset)));
}

self.addEventListener('install', (event) => {
  event.waitUntil(precacheShell().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

function isHandled(request) {
  if (request.method !== 'GET') return false;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return false;
  return !NETWORK_ONLY.some((prefix) => url.pathname.startsWith(prefix));
}

function offlineFallback(request) {
  const english = new URL(request.url).pathname.startsWith(`${BASE}en/`);
  return caches.match(english ? OFFLINE_PAGES[1] : OFFLINE_PAGES[0]);
}

async function store(request, response) {
  if (response.ok && response.type === 'basic') {
    const cache = await caches.open(CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request) {
  try {
    return await store(request, await fetch(request));
  } catch {
    return (await caches.match(request)) ?? (await offlineFallback(request)) ?? Response.error();
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    return await store(request, await fetch(request));
  } catch {
    return Response.error();
  }
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  const network = fetch(request)
    .then((response) => store(request, response))
    .catch(() => undefined);
  return cached ?? (await network) ?? Response.error();
}

function strategyFor(request) {
  if (request.mode === 'navigate') return networkFirst;
  const { pathname } = new URL(request.url);
  return STATIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
    ? cacheFirst
    : staleWhileRevalidate;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (!isHandled(request)) return;
  event.respondWith(strategyFor(request)(request));
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }
  const title = typeof data.title === 'string' && data.title !== '' ? data.title : 'Deus';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: typeof data.body === 'string' ? data.body : '',
      tag: typeof data.tag === 'string' ? data.tag : undefined,
      icon: NOTIFICATION_ICON,
      badge: NOTIFICATION_ICON,
      data: { url: typeof data.url === 'string' ? data.url : BASE },
    }),
  );
});

function sameOriginTarget(value) {
  try {
    const url = new URL(value, self.location.origin);
    return url.origin === self.location.origin ? url.href : `${self.location.origin}${BASE}`;
  } catch {
    return `${self.location.origin}${BASE}`;
  }
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = sameOriginTarget(event.notification.data?.url);
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const open = windows.find((client) => 'focus' in client);
      if (open) return open.navigate(target).then((client) => client?.focus());
      return self.clients.openWindow(target);
    }),
  );
});
