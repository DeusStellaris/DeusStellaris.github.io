/**
 * Catálogos publicados del sitio. Se obtienen de índices estáticos generados en el build y se
 * cachean en memoria. Así un like o una reseña solo se aceptan para contenido que existe y está
 * publicado, sin una segunda fuente de verdad.
 *  - Proyectos: search-index.json (entradas 'project:<slug>:<locale>').
 *  - Demos: demos-index.json ({ slugs: [...] }).
 */

const CACHE_TTL_MS = 10 * 60 * 1000;
const FETCH_TIMEOUT_MS = 5_000;

/** @type {Map<string, { slugs: Set<string>, expires: number }>} */
const caches = new Map();

/**
 * @param {string} url
 * @param {(body: any) => Iterable<string> | null} extract
 * @param {typeof fetch} fetchImpl
 * @param {number} now
 * @returns {Promise<Set<string>>}
 */
async function loadSlugs(url, extract, fetchImpl, now) {
  const cached = caches.get(url);
  if (cached && cached.expires > now) return cached.slugs;

  const response = await fetchImpl(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error('catalog_http');

  const found = extract(await response.json());
  if (!found) throw new Error('catalog_shape');

  const slugs = new Set(found);
  caches.set(url, { slugs, expires: now + CACHE_TTL_MS });
  return slugs;
}

/** @param {any} body */
function projectSlugsOf(body) {
  const entries = Array.isArray(body?.entries) ? body.entries : null;
  if (!entries) return null;
  const slugs = [];
  for (const entry of entries) {
    if (entry?.type !== 'project' || typeof entry.id !== 'string') continue;
    const parts = entry.id.split(':');
    if (parts.length === 3 && parts[1]) slugs.push(parts[1]);
  }
  return slugs;
}

/** @param {any} body */
function demoSlugsOf(body) {
  return Array.isArray(body?.slugs) && body.slugs.every((slug) => typeof slug === 'string')
    ? body.slugs
    : null;
}

/**
 * @param {string} indexUrl URL del search-index.json publicado (SITE_INDEX_URL).
 * @param {typeof fetch} fetchImpl
 * @param {number} now
 */
export function publishedSlugs(
  indexUrl,
  fetchImpl = (...args) => fetch(...args),
  now = Date.now(),
) {
  return loadSlugs(indexUrl, projectSlugsOf, fetchImpl, now);
}

/**
 * @param {string} indexUrl URL del demos-index.json publicado (DEMOS_INDEX_URL).
 * @param {typeof fetch} fetchImpl
 * @param {number} now
 */
export function publishedDemoSlugs(
  indexUrl,
  fetchImpl = (...args) => fetch(...args),
  now = Date.now(),
) {
  return loadSlugs(indexUrl, demoSlugsOf, fetchImpl, now);
}

/** Solo para pruebas. */
export function resetCatalogCache() {
  caches.clear();
}
