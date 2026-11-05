/**
 * Cliente OAuth de GitHub. Solo se llama desde el Worker: el client_secret nunca sale de aquí.
 */

export const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
export const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';

const TOKEN_TIMEOUT_MS = 10_000;

export class OAuthError extends Error {
  /** @param {string} code Código interno, sin datos sensibles. */
  constructor(code) {
    super(code);
    this.name = 'OAuthError';
    this.code = code;
  }
}

/**
 * @param {{ clientId: string, redirectUri: string, scope: string, state: string, codeChallenge: string }} params
 */
export function buildAuthorizeUrl({ clientId, redirectUri, scope, state, codeChallenge }) {
  const url = new URL(GITHUB_AUTHORIZE_URL);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', scope);
  url.searchParams.set('state', state);
  url.searchParams.set('code_challenge', codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');
  return url.toString();
}

/**
 * Canjea el código por un access token. Envía el code_verifier de PKCE junto con el client_secret.
 * Si GitHub no devuelve un token, lanza OAuthError sin incluir el cuerpo de la respuesta.
 *
 * @param {{ clientId: string, clientSecret: string, code: string, redirectUri: string, codeVerifier: string, fetchImpl?: typeof fetch }} params
 * @returns {Promise<string>}
 */
export async function exchangeCodeForToken({
  clientId,
  clientSecret,
  code,
  redirectUri,
  codeVerifier,
  fetchImpl = (...args) => fetch(...args),
}) {
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });

  let response;
  try {
    response = await fetchImpl(GITHUB_TOKEN_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
      signal: AbortSignal.timeout(TOKEN_TIMEOUT_MS),
    });
  } catch {
    throw new OAuthError('token_request_failed');
  }

  if (!response.ok) throw new OAuthError('token_http_error');

  let json;
  try {
    json = await response.json();
  } catch {
    throw new OAuthError('token_invalid_body');
  }

  if (typeof json?.access_token !== 'string' || json.access_token.length === 0) {
    throw new OAuthError('token_missing');
  }
  return json.access_token;
}
