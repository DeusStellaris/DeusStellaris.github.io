/**
 * Configuración del Worker: aplicaciones OAuth y orígenes permitidos.
 *
 * Solo hay dos orígenes de administración posibles:
 *  - producción: el sitio en GitHub Pages (siempre activo).
 *  - desarrollo: http://localhost:4321 (solo si DEV_OAUTH_ENABLED = "true", en el entorno local).
 *
 * Cada origen tiene su propia OAuth App de GitHub. Los identificadores públicos (client_id)
 * van en wrangler.toml; los secretos (client_secret) solo en `wrangler secret put` o en .dev.vars.
 */

export const PRODUCTION_ORIGIN = 'https://DeusStellaris.github.io';
export const DEVELOPMENT_ORIGIN = 'http://localhost:4321';

/** Origen canónico (host en minúsculas), tal como lo informa el navegador en Referer y postMessage. */
const canonicalOrigin = (value) => new URL(value).origin;

const CLIENT_ID_PATTERN = /^[A-Za-z0-9._-]{5,64}$/;

/**
 * @typedef {object} OAuthApp
 * @property {'production' | 'development'} name
 * @property {string} origin Origen desde el que Decap CMS abre el popup de login.
 * @property {string | undefined} clientId
 * @property {string | undefined} clientSecret
 */

/**
 * @param {Record<string, string | undefined>} env
 * @returns {OAuthApp[]}
 */
export function resolveApps(env) {
  /** @type {OAuthApp[]} */
  const apps = [
    {
      name: 'production',
      origin: canonicalOrigin(PRODUCTION_ORIGIN),
      clientId: env.GITHUB_CLIENT_ID_PROD,
      clientSecret: env.GITHUB_CLIENT_SECRET_PROD,
    },
  ];

  if (env.DEV_OAUTH_ENABLED === 'true') {
    apps.push({
      name: 'development',
      origin: canonicalOrigin(DEVELOPMENT_ORIGIN),
      clientId: env.GITHUB_CLIENT_ID_DEV,
      clientSecret: env.GITHUB_CLIENT_SECRET_DEV,
    });
  }

  return apps;
}

/**
 * Una aplicación está lista solo si tiene client_id con formato válido y client_secret.
 * @param {OAuthApp} app
 * @returns {boolean}
 */
export function isAppConfigured(app) {
  return (
    typeof app.clientId === 'string' &&
    CLIENT_ID_PATTERN.test(app.clientId) &&
    typeof app.clientSecret === 'string' &&
    app.clientSecret.length >= 20
  );
}

/**
 * Elige la aplicación según el Referer del popup de login.
 * Sin Referer se usa producción. Un Referer de un origen no listado devuelve null.
 * @param {OAuthApp[]} apps
 * @param {string | null} referer
 * @returns {OAuthApp | null}
 */
export function appForReferer(apps, referer) {
  if (!referer) return apps.find((app) => app.name === 'production') ?? null;
  let origin;
  try {
    origin = new URL(referer).origin;
  } catch {
    return null;
  }
  return apps.find((app) => app.origin === origin) ?? null;
}

/**
 * @param {OAuthApp[]} apps
 * @param {string} name
 * @returns {OAuthApp | null}
 */
export function appByName(apps, name) {
  return apps.find((app) => app.name === name) ?? null;
}
