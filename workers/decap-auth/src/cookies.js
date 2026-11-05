/**
 * Cookie de transacción OAuth.
 *
 * Prefijo __Host-: obliga a Secure, Path=/ y ausencia de Domain, así que no puede
 * sobrescribirse desde un subdominio. HttpOnly: no es accesible desde JavaScript.
 * SameSite=Lax: el navegador la envía en la navegación de vuelta desde GitHub (GET de nivel superior)
 * y no en peticiones de terceros.
 */

export const STATE_COOKIE_NAME = '__Host-deus_decap_oauth';
export const STATE_COOKIE_MAX_AGE_SECONDS = 300;

/** @param {string} value */
export function buildStateCookie(value) {
  return `${STATE_COOKIE_NAME}=${value}; Path=/; Max-Age=${STATE_COOKIE_MAX_AGE_SECONDS}; HttpOnly; Secure; SameSite=Lax`;
}

export function clearStateCookie() {
  return `${STATE_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}

/**
 * @param {string | null} header Cabecera Cookie completa.
 * @param {string} name
 * @returns {string | null}
 */
export function readCookie(header, name) {
  if (!header) return null;
  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0) continue;
    if (part.slice(0, separator).trim() === name) {
      return part.slice(separator + 1).trim();
    }
  }
  return null;
}
