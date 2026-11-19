/**
 * Configuración del Worker de la API. Los orígenes permitidos son una lista explícita:
 * no se acepta CORS comodín ni orígenes derivados de la petición.
 */

/**
 * Origen canónico (esquema, host en minúsculas y puerto) o null si no es una URL válida.
 * Se aplica tanto a la lista configurada como a la cabecera Origin entrante.
 * @param {string | null | undefined} value
 * @returns {string | null}
 */
export function canonicalizeOrigin(value) {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

/**
 * Convierte la lista de orígenes en orígenes canónicos. Un valor mal formado no lanza:
 * se devuelve null y la configuración queda incompleta.
 * @param {string | undefined} value
 * @returns {string[] | null}
 */
export function parseOrigins(value) {
  if (!value) return null;
  const origins = [];
  for (const raw of value.split(',')) {
    const item = raw.trim();
    if (item === '') continue;
    try {
      origins.push(new URL(item).origin);
    } catch {
      return null;
    }
  }
  return origins.length > 0 ? origins : null;
}

/**
 * @param {Record<string, string | undefined>} env
 * @returns {{ ok: true, config: ApiConfig } | { ok: false, missing: string[] }}
 */
export function readConfig(env) {
  const missing = [];
  if (!env.SUPABASE_URL) missing.push('SUPABASE_URL');
  if (!env.SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (!env.VISITOR_HASH_PEPPER || env.VISITOR_HASH_PEPPER.length < 32)
    missing.push('VISITOR_HASH_PEPPER');
  if (!env.SITE_INDEX_URL) missing.push('SITE_INDEX_URL');
  const allowedOrigins = parseOrigins(env.ALLOWED_ORIGINS);
  if (!allowedOrigins) missing.push('ALLOWED_ORIGINS');
  if (missing.length > 0) return { ok: false, missing };

  return {
    ok: true,
    config: {
      supabase: {
        url: /** @type {string} */ (env.SUPABASE_URL),
        serviceKey: /** @type {string} */ (env.SUPABASE_SERVICE_ROLE_KEY),
      },
      pepper: /** @type {string} */ (env.VISITOR_HASH_PEPPER),
      siteIndexUrl: /** @type {string} */ (env.SITE_INDEX_URL),
      demosIndexUrl: env.DEMOS_INDEX_URL || null,
      allowedOrigins,
    },
  };
}

/**
 * @typedef {object} ApiConfig
 * @property {{ url: string, serviceKey: string }} supabase
 * @property {string} pepper
 * @property {string} siteIndexUrl
 * @property {string | null} demosIndexUrl Índice de demos publicadas; sin valor las reseñas responden 503.
 * @property {string[]} allowedOrigins
 */
