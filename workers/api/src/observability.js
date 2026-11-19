/**
 * Observabilidad ligera y respetuosa con la privacidad.
 *
 *  - Trazabilidad: cada petición mide su duración, responde con Server-Timing y, si supera el umbral,
 *    emite una línea JSON `slow_request` con el trace-id W3C (traceparent entrante o uno nuevo).
 *    Con `[observability]` activo en wrangler.toml, Workers Logs y su exportación OpenTelemetry
 *    recogen esas líneas sin código adicional.
 *  - RUM: POST /vitals recibe Web Vitals reales del navegador. Sin cookies, sin IP, sin
 *    identificadores: solo métrica, valor y ruta normalizada. Se registra como línea `rum`; no se guarda.
 */

import { canonicalizeOrigin, readConfig } from './config.js';
import { errorResponse } from './http.js';

export const SLOW_REQUEST_MS = 800;
const MAX_VITALS_BODY_BYTES = 1024;
const VITAL_NAMES = Object.freeze(['LCP', 'INP', 'CLS', 'FCP', 'TTFB']);
const RATINGS = Object.freeze(['good', 'needs-improvement', 'poor']);
const PATH_PATTERN = /^\/[A-Za-z0-9/_.-]{0,200}$/;
const TRACEPARENT = /^00-([0-9a-f]{32})-[0-9a-f]{16}-[0-9a-f]{2}$/;

/**
 * Trace-id del encabezado traceparent entrante o uno nuevo de 128 bits.
 * @param {string | null} traceparent
 */
export function traceIdOf(traceparent) {
  const match = traceparent ? TRACEPARENT.exec(traceparent) : null;
  return match ? match[1] : crypto.randomUUID().replaceAll('-', '');
}

/**
 * Cuerpo JSON enviado como text/plain: es una petición CORS simple, sin preflight, y puede salir
 * al ocultarse la página con fetch keepalive.
 * @param {Request} request
 */
async function readVitalsBody(request) {
  const text = await request.text();
  if (new TextEncoder().encode(text).length > MAX_VITALS_BODY_BYTES) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * Valida una muestra de Web Vitals. Devuelve la muestra normalizada o null.
 * @param {unknown} body
 */
export function parseVitalsBody(body) {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return null;
  const { name, value, rating, path } = /** @type {Record<string, unknown>} */ (body);
  if (typeof name !== 'string' || !VITAL_NAMES.includes(name)) return null;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 600_000) {
    return null;
  }
  if (typeof rating !== 'string' || !RATINGS.includes(rating)) return null;
  if (typeof path !== 'string' || !PATH_PATTERN.test(path)) return null;
  return { name, value: Math.round(value * 1000) / 1000, rating, path };
}

/**
 * Mide el manejador: añade Server-Timing y registra las peticiones lentas.
 * @param {Request} request
 * @param {string} route
 * @param {() => Promise<Response>} run
 */
export async function traced(request, route, run) {
  const started = Date.now();
  const response = await run();
  const ms = Date.now() - started;
  const headers = new Headers(response.headers);
  headers.append('Server-Timing', `app;dur=${ms}`);
  if (ms >= SLOW_REQUEST_MS) {
    console.warn(
      JSON.stringify({
        event: 'slow_request',
        route,
        method: request.method,
        status: response.status,
        ms,
        traceId: traceIdOf(request.headers.get('traceparent')),
      }),
    );
  }
  return new Response(response.body, { status: response.status, headers });
}

/** @param {Request} request @param {Record<string, string | undefined>} env */
export async function handleVitals(request, env) {
  const origin = canonicalizeOrigin(request.headers.get('origin'));
  const loaded = readConfig(env);
  if (!loaded.ok || !origin || !loaded.config.allowedOrigins.includes(origin)) {
    return errorResponse(403, 'Origen no permitido.', null);
  }
  const sample = parseVitalsBody(await readVitalsBody(request));
  if (!sample) return errorResponse(400, 'Solicitud no válida.', origin);
  console.log(JSON.stringify({ event: 'rum', ...sample }));
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      Vary: 'Origin',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
