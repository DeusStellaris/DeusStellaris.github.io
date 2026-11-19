/**
 * Respuestas HTTP con cabeceras de seguridad comunes.
 *
 * Nota: no se envía Cross-Origin-Opener-Policy. Decap necesita window.opener para recibir el
 * token; una política COOP estricta lo dejaría en null y rompería el inicio de sesión.
 */

/** @param {string} contentSecurityPolicy */
function baseHeaders(contentSecurityPolicy) {
  return {
    'Cache-Control': 'no-store',
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Content-Security-Policy': contentSecurityPolicy,
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains',
  };
}

/** CSP de las páginas que no ejecutan scripts. */
export const STRICT_CSP =
  "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";

/**
 * @param {string} nonce
 * @returns {string} CSP de la página que comunica el token: solo un script con nonce.
 */
export function popupCsp(nonce) {
  return `default-src 'none'; script-src 'nonce-${nonce}'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`;
}

/**
 * @param {string} html
 * @param {{ status?: number, csp?: string, headers?: Record<string, string> }} [options]
 */
export function htmlResponse(html, options = {}) {
  return new Response(html, {
    status: options.status ?? 200,
    headers: {
      ...baseHeaders(options.csp ?? STRICT_CSP),
      'Content-Type': 'text/html; charset=utf-8',
      ...options.headers,
    },
  });
}

/**
 * @param {string} location
 * @param {Record<string, string>} [headers]
 */
export function redirectResponse(location, headers = {}) {
  return new Response(null, {
    status: 302,
    headers: {
      ...baseHeaders(STRICT_CSP),
      Location: location,
      ...headers,
    },
  });
}

/** @param {string[]} allowed */
export function methodNotAllowed(allowed) {
  return new Response('Método no permitido.', {
    status: 405,
    headers: { ...baseHeaders(STRICT_CSP), Allow: allowed.join(', ') },
  });
}
