/**
 * Worker de la API de likes del portafolio Deus.
 *
 *   POST /likes  { slug, visitorId, action: "like" | "unlike" }  →  { slug, likes, liked }
 *   POST /consent, POST /push/subscribe, POST /push/unsubscribe  (ver consent.js y push.js)
 *
 * Capas de defensa, en orden:
 *   1. Origen: solo los orígenes del sitio (lista explícita) reciben CORS. Sin origen permitido → 403.
 *   2. Método y ruta: solo las rutas POST de ROUTES y el preflight OPTIONS.
 *   3. Cuerpo: JSON, tamaño máximo, formato de slug, UUID de visitante y acción permitida.
 *   4. Existencia: el slug debe estar publicado en el índice del sitio.
 *   5. Frecuencia: límite por IP y por visitante, atómico en la base de datos.
 *   6. Persistencia: solo HMAC del visitante y de la IP (pseudónimos), nunca datos en claro.
 */

import { publishedSlugs } from './catalog.js';
import { canonicalizeOrigin, readConfig } from './config.js';
import { handleConsent } from './consent.js';
import { pseudonymize } from './hash.js';
import { errorResponse, jsonResponse, preflight } from './http.js';
import { handlePushSubscribe, handlePushUnsubscribe } from './push.js';
import { consumeRateLimit, countLikes, deleteLike, insertLike, SupabaseError } from './supabase.js';
import { parseLikeBody, readJsonBody } from './validation.js';

/** Límites de frecuencia: por IP y por visitante. */
const LIMITS = {
  ipPerMinute: { limit: 30, windowSeconds: 60 },
  visitorPerHour: { limit: 120, windowSeconds: 3600 },
};

/**
 * @param {Request} request
 * @param {Record<string, string | undefined>} env
 */
async function handleLikes(request, env) {
  const origin = canonicalizeOrigin(request.headers.get('origin'));
  const loaded = readConfig(env);
  if (!loaded.ok) {
    console.error('config_missing', loaded.missing.join(','));
    return errorResponse(503, 'El servicio no está disponible en este momento.', null);
  }
  const { config } = loaded;

  if (!origin || !config.allowedOrigins.includes(origin)) {
    return errorResponse(403, 'Origen no permitido.', null);
  }

  const body = await readJsonBody(request);
  const parsed = body === null ? null : parseLikeBody(body);
  if (!parsed) return errorResponse(400, 'Solicitud no válida.', origin);

  let slugs;
  try {
    slugs = await publishedSlugs(config.siteIndexUrl);
  } catch {
    console.error('catalog_unavailable');
    return errorResponse(503, 'El servicio no está disponible en este momento.', origin);
  }
  if (!slugs.has(parsed.slug)) return errorResponse(404, 'Proyecto no encontrado.', origin);

  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  const ipKey = await pseudonymize(config.pepper, 'ip', ip);
  const visitorHash = await pseudonymize(config.pepper, 'visitor', parsed.visitorId);

  try {
    const ipAllowed = await consumeRateLimit(config.supabase, {
      key: `like:ip:${ipKey}`,
      ...LIMITS.ipPerMinute,
    });
    const visitorAllowed = ipAllowed
      ? await consumeRateLimit(config.supabase, {
          key: `like:visitor:${visitorHash}`,
          ...LIMITS.visitorPerHour,
        })
      : false;
    if (!ipAllowed || !visitorAllowed) {
      return errorResponse(429, 'Demasiadas solicitudes. Esperá un momento.', origin, {
        'Retry-After': '60',
      });
    }

    const row = { slug: parsed.slug, visitorHash };
    if (parsed.action === 'like') await insertLike(config.supabase, row);
    else await deleteLike(config.supabase, row);

    const likes = await countLikes(config.supabase, parsed.slug);
    return jsonResponse({ slug: parsed.slug, likes, liked: parsed.action === 'like' }, 200, origin);
  } catch (error) {
    console.error('likes_storage_error', error instanceof SupabaseError ? error.code : 'unknown');
    return errorResponse(502, 'No se pudo registrar la solicitud. Intentalo más tarde.', origin);
  }
}

/** Rutas POST de la API. */
const ROUTES = {
  '/likes': handleLikes,
  '/consent': handleConsent,
  '/push/subscribe': handlePushSubscribe,
  '/push/unsubscribe': handlePushUnsubscribe,
};

export default {
  /**
   * @param {Request} request
   * @param {Record<string, string | undefined>} env
   */
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    const origin = canonicalizeOrigin(request.headers.get('origin'));
    const handler = Object.hasOwn(ROUTES, pathname)
      ? ROUTES[/** @type {keyof typeof ROUTES} */ (pathname)]
      : null;

    try {
      if (!handler) return errorResponse(404, 'Recurso no encontrado.', origin);
      if (request.method === 'OPTIONS') return preflight(request, env);
      if (request.method !== 'POST') {
        return errorResponse(405, 'Método no permitido.', origin, { Allow: 'POST, OPTIONS' });
      }
      return await handler(request, env);
    } catch (error) {
      // Error inesperado: respuesta genérica, sin detalles ni stack trace.
      console.error('api_unexpected', error instanceof Error ? error.name : 'unknown');
      return errorResponse(500, 'Ocurrió un error interno.', origin);
    }
  },
};

export { LIMITS };
