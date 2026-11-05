/**
 * Worker de autenticación para Decap CMS (GitHub, flujo popup con PKCE).
 *
 * Rutas:
 *  - GET /auth      Inicia la autorización. Devuelve 302 a GitHub y fija la cookie de transacción.
 *  - GET /callback  Recibe el código de GitHub, valida state, canjea el código y entrega el token
 *                   al opener mediante postMessage.
 *
 * Callback OAuth de GitHub = https://<worker>/callback. La página /admin/ del sitio NO es el callback:
 * recibe el token solo a través del postMessage de esta página.
 */

import { appByName, appForReferer, isAppConfigured, resolveApps } from './config.js';
import { buildStateCookie, clearStateCookie, readCookie, STATE_COOKIE_NAME } from './cookies.js';
import {
  constantTimeEqual,
  importStateKey,
  openState,
  pkceChallenge,
  randomBase64url,
  sealState,
} from './crypto.js';
import { htmlResponse, methodNotAllowed, popupCsp, redirectResponse } from './http.js';
import { buildAuthorizeUrl, exchangeCodeForToken, OAuthError } from './oauth.js';
import { errorPage, popupSuccessPage } from './pages.js';
import {
  isGithubProvider,
  isTransactionFresh,
  isValidAuthorizationCode,
  isValidState,
  normalizeScope,
} from './validation.js';

/** @typedef {Record<string, string | undefined>} Env */

/**
 * @param {Request} request
 * @param {Env} env
 */
async function enforceRateLimit(request, env) {
  // Límite opcional por IP mediante un binding de Cloudflare Rate Limiting (ver README).
  // Si no está configurado, la protección recae en la regla de WAF documentada.
  const limiter =
    /** @type {{ limit?: (args: { key: string }) => Promise<{ success: boolean }> } | undefined} */ (
      /** @type {unknown} */ (env.AUTH_RATE_LIMITER)
    );
  if (!limiter || typeof limiter.limit !== 'function') return true;
  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  const result = await limiter.limit({ key: ip });
  return result.success;
}

/**
 * @param {Request} request
 * @param {Env} env
 */
async function handleAuth(request, env) {
  const url = new URL(request.url);
  const apps = resolveApps(env);
  const app = appForReferer(apps, request.headers.get('referer'));

  if (!app) {
    return htmlResponse(errorPage('Este origen no está autorizado para iniciar sesión.'), {
      status: 403,
    });
  }
  if (!isAppConfigured(app)) {
    return htmlResponse(errorPage('El inicio de sesión no está disponible en este momento.'), {
      status: 503,
    });
  }
  if (!isGithubProvider(url.searchParams.get('provider'))) {
    return htmlResponse(errorPage('Proveedor de inicio de sesión no válido.'), { status: 400 });
  }
  const scope = normalizeScope(url.searchParams.get('scope'));
  if (!scope) {
    return htmlResponse(errorPage('Alcance de autorización no permitido.'), { status: 400 });
  }

  const stateKey = await importStateKey(env.OAUTH_STATE_KEY);
  const state = randomBase64url(32);
  const verifier = randomBase64url(32);
  const challenge = await pkceChallenge(verifier);

  const sealed = await sealState(stateKey, {
    s: state,
    v: verifier,
    a: app.name,
    sc: scope,
    t: Math.floor(Date.now() / 1000),
  });

  const location = buildAuthorizeUrl({
    clientId: /** @type {string} */ (app.clientId),
    redirectUri: `${url.origin}/callback`,
    scope,
    state,
    codeChallenge: challenge,
  });

  return redirectResponse(location, { 'Set-Cookie': buildStateCookie(sealed) });
}

/**
 * @param {Request} request
 * @param {Env} env
 */
async function handleCallback(request, env) {
  const url = new URL(request.url);
  const apps = resolveApps(env);
  const failure = (message, status) =>
    htmlResponse(errorPage(message), {
      status,
      headers: { 'Set-Cookie': clearStateCookie() },
    });

  const stateKey = await importStateKey(env.OAUTH_STATE_KEY);
  const cookie = readCookie(request.headers.get('cookie'), STATE_COOKIE_NAME);
  const payload = cookie ? await openState(stateKey, cookie) : null;

  if (!payload) {
    return failure('La autorización venció o no es válida. Volvé a intentarlo.', 400);
  }
  if (!isTransactionFresh(payload.t, Math.floor(Date.now() / 1000))) {
    return failure('La autorización venció. Volvé a intentarlo.', 400);
  }

  const app = typeof payload.a === 'string' ? appByName(apps, payload.a) : null;
  if (!app || !isAppConfigured(app)) {
    return failure('El inicio de sesión no está disponible en este momento.', 503);
  }

  if (url.searchParams.has('error')) {
    return failure('Cancelaste la autorización en GitHub.', 400);
  }

  const state = url.searchParams.get('state');
  const expected = typeof payload.s === 'string' ? payload.s : '';
  if (!isValidState(state) || !constantTimeEqual(/** @type {string} */ (state), expected)) {
    return failure('La autorización no coincide con la solicitud. Volvé a intentarlo.', 400);
  }

  const code = url.searchParams.get('code');
  if (!isValidAuthorizationCode(code) || typeof payload.v !== 'string') {
    return failure('La respuesta de GitHub no es válida.', 400);
  }

  let token;
  try {
    token = await exchangeCodeForToken({
      clientId: /** @type {string} */ (app.clientId),
      clientSecret: /** @type {string} */ (app.clientSecret),
      code: /** @type {string} */ (code),
      redirectUri: `${url.origin}/callback`,
      codeVerifier: payload.v,
    });
  } catch (error) {
    // Solo el código interno: nunca el cuerpo de la respuesta ni el token.
    console.error('oauth_exchange_failed', error instanceof OAuthError ? error.code : 'unknown');
    return failure('No se pudo completar la autorización con GitHub. Intentalo más tarde.', 502);
  }

  const nonce = randomBase64url(16);
  const html = popupSuccessPage({
    token,
    allowedOrigins: [app.origin],
    nonce,
  });
  return htmlResponse(html, {
    csp: popupCsp(nonce),
    headers: { 'Set-Cookie': clearStateCookie() },
  });
}

export default {
  /**
   * @param {Request} request
   * @param {Env} env
   */
  async fetch(request, env) {
    const url = new URL(request.url);
    const isRoute = url.pathname === '/auth' || url.pathname === '/callback';

    if (!isRoute) {
      return htmlResponse(errorPage('Recurso no encontrado.'), { status: 404 });
    }
    if (request.method !== 'GET') {
      return methodNotAllowed(['GET']);
    }

    try {
      if (!(await enforceRateLimit(request, env))) {
        return htmlResponse(errorPage('Demasiados intentos. Esperá un minuto.'), {
          status: 429,
          headers: { 'Retry-After': '60' },
        });
      }
      return url.pathname === '/auth'
        ? await handleAuth(request, env)
        : await handleCallback(request, env);
    } catch (error) {
      // Error de configuración (p. ej. OAUTH_STATE_KEY ausente) o inesperado: respuesta genérica.
      console.error('auth_worker_error', error instanceof Error ? error.name : 'unknown');
      return htmlResponse(errorPage('Ocurrió un error interno. Intentalo más tarde.'), {
        status: 500,
      });
    }
  },
};
