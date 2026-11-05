/**
 * Registro de consentimientos: aceptación de términos, de privacidad y preferencia de publicidad.
 *
 *   POST /consent  { type, granted, documentVersion, locale, visitorId }  →  201 { type, registered, acceptedAt }
 *
 * - La hora (acceptedAt) la genera la base de datos (DEFAULT now(), UTC). El cliente no puede
 *   enviarla ni influir en ella: cualquier campo de hora del cuerpo se ignora.
 * - La versión del documento debe coincidir con la vigente del servidor.
 * - Términos y privacidad solo admiten aceptación (granted = true). La publicidad admite ambos valores.
 * - Solo se guarda un HMAC del identificador anónimo de sesión, nunca el identificador en claro.
 */

import { canonicalizeOrigin, readConfig } from './config.js';
import { pseudonymize } from './hash.js';
import { errorResponse, jsonResponse, preflightResponse } from './http.js';
import { LEGAL_VERSIONS } from './legal-versions.js';
import { consumeRateLimit, insertConsent, SupabaseError } from './supabase.js';
import { readJsonBody, UUID_V4_PATTERN } from './validation.js';

export const CONSENT_TYPES = Object.freeze(['terms', 'privacy', 'cookies_ads']);
const LOCALES = Object.freeze(['es', 'en']);
const CONSENT_LIMIT = { limit: 20, windowSeconds: 60 };

/**
 * Valida el cuerpo de un consentimiento. Devuelve el objeto normalizado o null.
 * Ignora cualquier otro campo, en particular cualquier hora enviada por el cliente.
 * @param {unknown} body
 */
export function parseConsentBody(body) {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return null;
  const { type, granted, documentVersion, locale, visitorId } =
    /** @type {Record<string, unknown>} */ (body);

  if (typeof type !== 'string' || !CONSENT_TYPES.includes(type)) return null;
  if (typeof granted !== 'boolean') return null;
  if (typeof visitorId !== 'string' || !UUID_V4_PATTERN.test(visitorId)) return null;
  if (typeof locale !== 'string' || !LOCALES.includes(locale)) return null;

  const expectedVersion =
    type === 'cookies_ads'
      ? LEGAL_VERSIONS.cookies
      : LEGAL_VERSIONS[/** @type {'terms' | 'privacy'} */ (type)];
  if (documentVersion !== expectedVersion) return null;

  // La aceptación de términos y privacidad no se puede registrar como rechazo.
  if ((type === 'terms' || type === 'privacy') && granted !== true) return null;

  return { type, granted, documentVersion, locale, visitorId };
}

/**
 * @param {Request} request
 * @param {Record<string, string | undefined>} env
 */
export async function handleConsent(request, env) {
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

  const parsed = parseConsentBody(await readJsonBody(request));
  if (!parsed) return errorResponse(400, 'Solicitud no válida.', origin);

  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  const ipKey = await pseudonymize(config.pepper, 'ip', ip);
  const sessionHash = await pseudonymize(config.pepper, 'consent', parsed.visitorId);

  try {
    const allowed = await consumeRateLimit(config.supabase, {
      key: `consent:ip:${ipKey}`,
      ...CONSENT_LIMIT,
    });
    if (!allowed) {
      return errorResponse(429, 'Demasiadas solicitudes. Esperá un momento.', origin, {
        'Retry-After': '60',
      });
    }

    const acceptedAt = await insertConsent(config.supabase, {
      type: parsed.type,
      granted: parsed.granted,
      documentVersion: parsed.documentVersion,
      locale: parsed.locale,
      sessionHash,
    });
    return jsonResponse({ type: parsed.type, registered: true, acceptedAt }, 201, origin);
  } catch (error) {
    console.error('consent_storage_error', error instanceof SupabaseError ? error.code : 'unknown');
    return errorResponse(502, 'No se pudo registrar la solicitud. Intentalo más tarde.', origin);
  }
}

/** Preflight CORS para /consent, solo para orígenes permitidos. */
export function consentPreflight(request, env) {
  const origin = canonicalizeOrigin(request.headers.get('origin'));
  const loaded = readConfig(env);
  const allowed = loaded.ok ? loaded.config.allowedOrigins : [];
  return origin && allowed.includes(origin)
    ? preflightResponse(origin)
    : errorResponse(403, 'Origen no permitido.', null);
}
