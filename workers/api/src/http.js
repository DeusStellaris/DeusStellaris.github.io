/**
 * Respuestas HTTP de la API. CORS solo para orígenes ya validados por el router.
 */

import { canonicalizeOrigin, readConfig } from './config.js';

/** @param {string} origin Origen ya comprobado contra la lista permitida. */
function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    // Necesario para la cookie de sesión de cuentas; solo se emite a orígenes de la lista.
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '600',
    Vary: 'Origin',
  };
}

/** @param {string | null} origin */
function originHeaders(origin) {
  return origin ? corsHeaders(origin) : {};
}

/** Cabeceras de toda respuesta: la API solo devuelve JSON, nunca se enmarca ni usa APIs del navegador. */
export const SECURITY_HEADERS = Object.freeze({
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains',
  'Cross-Origin-Opener-Policy': 'same-origin',
});

/**
 * @param {unknown} body
 * @param {number} status
 * @param {string | null} origin
 * @param {Record<string, string>} [extra]
 */
export function jsonResponse(body, status, origin, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...SECURITY_HEADERS,
      ...originHeaders(origin),
      'Content-Type': 'application/json; charset=utf-8',
      ...extra,
    },
  });
}

/**
 * Error con mensaje fijo y genérico. Nunca incluye detalles internos.
 * @param {number} status
 * @param {string} message
 * @param {string | null} origin
 * @param {Record<string, string>} [extra]
 */
export function errorResponse(status, message, origin, extra = {}) {
  return jsonResponse({ error: message }, status, origin, extra);
}

/** @param {string} origin Origen ya comprobado. */
export function preflightResponse(origin) {
  return new Response(null, {
    status: 204,
    headers: { ...SECURITY_HEADERS, ...corsHeaders(origin) },
  });
}

/**
 * Preflight CORS común a todas las rutas, solo para orígenes permitidos.
 * @param {Request} request
 * @param {Record<string, string | undefined>} env
 */
export function preflight(request, env) {
  const origin = canonicalizeOrigin(request.headers.get('origin'));
  const loaded = readConfig(env);
  const allowed = loaded.ok ? loaded.config.allowedOrigins : [];
  return origin && allowed.includes(origin)
    ? preflightResponse(origin)
    : errorResponse(403, 'Origen no permitido.', null);
}

export { corsHeaders };
