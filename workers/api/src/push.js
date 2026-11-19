/**
 * Suscripciones de notificaciones push con preferencias granulares.
 *
 *   POST /push/subscribe    { subscription: { endpoint, keys: { p256dh, auth } },
 *                             preferences: { mode, categories, projects }, locale }  →  200 { registered: true }
 *   POST /push/unsubscribe  { endpoint }                                              →  200 { removed: true }
 *
 * - El modo "none" no se guarda: darse de baja borra la fila (/push/unsubscribe).
 * - El endpoint solo se acepta si es https y pertenece a un servicio push conocido: el Worker que
 *   envíe avisos nunca llamará a un destino arbitrario elegido por el cliente.
 * - Las claves VAPID no pasan por aquí: la pública se publica en el sitio y la privada es un
 *   secreto del Worker de envío.
 */

import { canonicalizeOrigin, readConfig } from './config.js';
import { pseudonymize } from './hash.js';
import { errorResponse, jsonResponse } from './http.js';
import {
  consumeRateLimit,
  deletePushSubscription,
  SupabaseError,
  upsertPushSubscription,
} from './supabase.js';
import { readJsonBody, SLUG_PATTERN } from './validation.js';

export const PUSH_MODES = Object.freeze(['all', 'categories', 'projects']);
export const PUSH_CATEGORIES = Object.freeze(['games', 'programs', 'freelance']);
const LOCALES = Object.freeze(['es', 'en']);
const MAX_PROJECTS = 50;
const MAX_ENDPOINT_LENGTH = 512;
const MAX_PUSH_BODY_BYTES = 4096;
const PUSH_LIMIT = { limit: 20, windowSeconds: 60 };
const BASE64URL_P256DH = /^[A-Za-z0-9_-]{87}$/;
const BASE64URL_AUTH = /^[A-Za-z0-9_-]{22}$/;

/** Servicios push de los navegadores principales. */
const PUSH_HOST_SUFFIXES = Object.freeze([
  'fcm.googleapis.com',
  'updates.push.services.mozilla.com',
  'push.services.mozilla.com',
  'notify.windows.com',
  'push.apple.com',
]);

/** @param {unknown} value @returns {string | null} */
function parseEndpoint(value) {
  if (typeof value !== 'string' || value.length > MAX_ENDPOINT_LENGTH) return null;
  try {
    const url = new URL(value);
    const known = PUSH_HOST_SUFFIXES.some(
      (suffix) => url.hostname === suffix || url.hostname.endsWith(`.${suffix}`),
    );
    return url.protocol === 'https:' && known && url.username === '' ? url.href : null;
  } catch {
    return null;
  }
}

/**
 * @param {unknown} value
 * @param {(item: string) => boolean} accepts
 * @param {number} max
 * @returns {string[] | null} Lista sin duplicados, o null si algún elemento no es válido.
 */
function parseList(value, accepts, max) {
  if (!Array.isArray(value) || value.length > max) return null;
  if (!value.every((item) => typeof item === 'string' && accepts(item))) return null;
  return [...new Set(/** @type {string[]} */ (value))];
}

/**
 * Valida el cuerpo de /push/subscribe. Devuelve el objeto normalizado o null.
 * @param {unknown} body
 */
export function parseSubscribeBody(body) {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return null;
  const { subscription, preferences, locale } = /** @type {Record<string, unknown>} */ (body);
  if (typeof locale !== 'string' || !LOCALES.includes(locale)) return null;

  if (typeof subscription !== 'object' || subscription === null) return null;
  const { endpoint, keys } = /** @type {Record<string, unknown>} */ (subscription);
  const parsedEndpoint = parseEndpoint(endpoint);
  if (!parsedEndpoint || typeof keys !== 'object' || keys === null) return null;
  const { p256dh, auth } = /** @type {Record<string, unknown>} */ (keys);
  if (typeof p256dh !== 'string' || !BASE64URL_P256DH.test(p256dh)) return null;
  if (typeof auth !== 'string' || !BASE64URL_AUTH.test(auth)) return null;

  if (typeof preferences !== 'object' || preferences === null) return null;
  const { mode, categories, projects } = /** @type {Record<string, unknown>} */ (preferences);
  if (typeof mode !== 'string' || !PUSH_MODES.includes(mode)) return null;
  const parsedCategories = parseList(
    categories,
    (item) => PUSH_CATEGORIES.includes(item),
    PUSH_CATEGORIES.length,
  );
  const parsedProjects = parseList(projects, (item) => SLUG_PATTERN.test(item), MAX_PROJECTS);
  if (!parsedCategories || !parsedProjects) return null;

  return {
    endpoint: parsedEndpoint,
    p256dh,
    auth,
    mode,
    categories: parsedCategories,
    projects: parsedProjects,
    locale,
  };
}

/** @param {unknown} body */
export function parseUnsubscribeBody(body) {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return null;
  const endpoint = parseEndpoint(/** @type {Record<string, unknown>} */ (body).endpoint);
  return endpoint ? { endpoint } : null;
}

/**
 * Comprobaciones comunes: configuración, origen permitido, cuerpo JSON y límite de frecuencia.
 * @param {Request} request
 * @param {Record<string, string | undefined>} env
 * @param {(body: unknown) => object | null} parse
 */
async function prepare(request, env, parse) {
  const origin = canonicalizeOrigin(request.headers.get('origin'));
  const loaded = readConfig(env);
  if (!loaded.ok) {
    console.error('config_missing', loaded.missing.join(','));
    return {
      response: errorResponse(503, 'El servicio no está disponible en este momento.', null),
    };
  }
  const { config } = loaded;
  if (!origin || !config.allowedOrigins.includes(origin)) {
    return { response: errorResponse(403, 'Origen no permitido.', null) };
  }

  const parsed = parse(await readJsonBody(request, MAX_PUSH_BODY_BYTES));
  if (!parsed) return { response: errorResponse(400, 'Solicitud no válida.', origin) };

  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  const ipKey = await pseudonymize(config.pepper, 'ip', ip);
  try {
    const allowed = await consumeRateLimit(config.supabase, {
      key: `push:ip:${ipKey}`,
      ...PUSH_LIMIT,
    });
    if (!allowed) {
      return {
        response: errorResponse(429, 'Demasiadas solicitudes. Esperá un momento.', origin, {
          'Retry-After': '60',
        }),
      };
    }
  } catch (error) {
    console.error('push_storage_error', error instanceof SupabaseError ? error.code : 'unknown');
    return {
      response: errorResponse(
        502,
        'No se pudo registrar la solicitud. Intentalo más tarde.',
        origin,
      ),
    };
  }
  return { origin, config, parsed };
}

/** @param {unknown} error @param {string | null} origin */
function storageFailure(error, origin) {
  console.error('push_storage_error', error instanceof SupabaseError ? error.code : 'unknown');
  return errorResponse(502, 'No se pudo registrar la solicitud. Intentalo más tarde.', origin);
}

/** @param {Request} request @param {Record<string, string | undefined>} env */
export async function handlePushSubscribe(request, env) {
  const ready = await prepare(request, env, parseSubscribeBody);
  if ('response' in ready) return ready.response;
  const { origin, config, parsed } = ready;
  try {
    const endpointHash = await pseudonymize(config.pepper, 'push', parsed.endpoint);
    await upsertPushSubscription(config.supabase, { ...parsed, endpointHash });
    return jsonResponse({ registered: true }, 200, origin);
  } catch (error) {
    return storageFailure(error, origin);
  }
}

/** @param {Request} request @param {Record<string, string | undefined>} env */
export async function handlePushUnsubscribe(request, env) {
  const ready = await prepare(request, env, parseUnsubscribeBody);
  if ('response' in ready) return ready.response;
  const { origin, config, parsed } = ready;
  try {
    const endpointHash = await pseudonymize(config.pepper, 'push', parsed.endpoint);
    await deletePushSubscription(config.supabase, endpointHash);
    return jsonResponse({ removed: true }, 200, origin);
  } catch (error) {
    return storageFailure(error, origin);
  }
}
