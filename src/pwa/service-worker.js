/*
 * Service Worker de Deus. Plantilla: src/pages/sw.js.ts sustituye la versión y la ruta base al construir.
 *
 * ESTRATEGIAS.
 * - Navegación: red primero; cada página visitada se guarda y sirve sin conexión.
 * - Recursos estáticos del mismo origen: caché primero con revalidación en segundo plano.
 * - Fuera de alcance (no se intercepta): otros orígenes, métodos distintos de GET y el panel /admin/.
 *
 * NOTIFICACIONES PUSH.
 * El payload es JSON { title, body, url, tag }. Solo se abren URLs del mismo origen.
 */

const VERSION = '__VERSION__';
const BASE = '__BASE__';
const CACHE = `deus-${VERSION}`;
const OFFLINE_PAGES = [`${BASE}offline/`, `${BASE}en/offline/`];
const PRECACHE = [
  ...OFFLINE_PAGES,
  `${BASE}manifest.webmanifest`,
  `${BASE}assets/icons/icon-192.png`,
];
const NOTIFICATION_ICON = `${BASE}assets/icons/icon-192.png`;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
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
  return url.origin === self.location.origin && !url.pathname.startsWith(`${BASE}admin/`);
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

async function navigate(request) {
  try {
    return await store(request, await fetch(request));
  } catch {
    return (await caches.match(request)) ?? (await offlineFallback(request)) ?? Response.error();
  }
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  const network = fetch(request)
    .then((response) => store(request, response))
    .catch(() => undefined);
  return cached ?? (await network) ?? Response.error();
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (!isHandled(request)) return;
  event.respondWith(
    request.mode === 'navigate' ? navigate(request) : staleWhileRevalidate(request),
  );
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
