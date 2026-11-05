/**
 * Validación de la entrada del Worker de la API. Todo dato del cliente se considera no confiable.
 */

export const MAX_BODY_BYTES = 1024;
export const SLUG_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,119}$/;
export const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
export const ALLOWED_ACTIONS = ['like', 'unlike'];

/**
 * Valida el cuerpo de un like. Devuelve el objeto normalizado o null si no es válido.
 * @param {unknown} body
 * @returns {{ slug: string, visitorId: string, action: 'like' | 'unlike' } | null}
 */
export function parseLikeBody(body) {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return null;
  const { slug, visitorId, action } = /** @type {Record<string, unknown>} */ (body);
  if (typeof slug !== 'string' || !SLUG_PATTERN.test(slug)) return null;
  if (typeof visitorId !== 'string' || !UUID_V4_PATTERN.test(visitorId)) return null;
  if (typeof action !== 'string' || !ALLOWED_ACTIONS.includes(action)) return null;
  return { slug, visitorId, action: /** @type {'like' | 'unlike'} */ (action) };
}

/**
 * Lee el cuerpo JSON con límite de tamaño. Devuelve null si excede el límite o no es JSON.
 * Se comprueba la longitud real del texto, no solo la cabecera Content-Length.
 * @param {Request} request
 * @returns {Promise<unknown | null>}
 */
export async function readJsonBody(request) {
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().startsWith('application/json')) return null;

  const declared = Number(request.headers.get('content-length') ?? '0');
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) return null;

  const text = await request.text();
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
