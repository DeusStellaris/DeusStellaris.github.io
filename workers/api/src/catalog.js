/**
 * Catálogo de proyectos publicados. Se obtiene del índice de búsqueda estático del sitio
 * (generado en build) y se cachea en memoria. Así un like solo se acepta para proyectos que
 * existen y están publicados, sin una segunda fuente de verdad.
 */

const CACHE_TTL_MS = 10 * 60 * 1000;
const FETCH_TIMEOUT_MS = 5_000;

/** @type {{ slugs: Set<string>, expires: number } | null} */
let cache = null;

/**
 * @param {string} indexUrl URL del search-index.json publicado (SITE_INDEX_URL).
 * @param {typeof fetch} fetchImpl
 * @param {number} now
 * @returns {Promise<Set<string>>}
 */
export async function publishedSlugs(
  indexUrl,
  fetchImpl = (...args) => fetch(...args),
  now = Date.now(),
) {
  if (cache && cache.expires > now) return cache.slugs;

  const response = await fetchImpl(indexUrl, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error('catalog_http');

  const body = await response.json();
  const entries = Array.isArray(body?.entries) ? body.entries : null;
  if (!entries) throw new Error('catalog_shape');

  const slugs = new Set();
  for (const entry of entries) {
    // id con forma 'project:<slug>:<locale>'
    if (entry?.type !== 'project' || typeof entry.id !== 'string') continue;
    const parts = entry.id.split(':');
    if (parts.length === 3 && parts[1]) slugs.add(parts[1]);
  }

  cache = { slugs, expires: now + CACHE_TTL_MS };
  return slugs;
}

/** Solo para pruebas. */
export function resetCatalogCache() {
  cache = null;
}
