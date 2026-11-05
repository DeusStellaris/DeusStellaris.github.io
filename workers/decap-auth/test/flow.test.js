import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { STATE_COOKIE_NAME } from '../src/cookies.js';
import { importStateKey, pkceChallenge, sealState } from '../src/crypto.js';
import worker from '../src/index.js';

const WORKER = 'https://deus-auth.example.workers.dev';
const PROD_REFERER = 'https://DeusStellaris.github.io/admin/';
const CLIENT_ID = 'Iv1.prodclient0001';
const CLIENT_SECRET = 's'.repeat(40);

/**
 * Petición mínima con las propiedades que usa el Worker. Referer y Cookie son cabeceras
 * prohibidas en el constructor de Request de fetch, por eso no se pasan por allí.
 */
function makeRequest(url, { method = 'GET', headers = {} } = {}) {
  return { url, method, headers: new Headers(headers) };
}

function keyBase64() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString('base64');
}

function makeEnv(overrides = {}) {
  return {
    GITHUB_CLIENT_ID_PROD: CLIENT_ID,
    GITHUB_CLIENT_SECRET_PROD: CLIENT_SECRET,
    OAUTH_STATE_KEY: keyBase64(),
    ...overrides,
  };
}

function authRequest(query = 'provider=github&scope=repo', headers = { referer: PROD_REFERER }) {
  return makeRequest(`${WORKER}/auth?${query}`, { headers });
}

function cookieFrom(response) {
  const header = response.headers.get('set-cookie') ?? '';
  const match = header.match(new RegExp(`${STATE_COOKIE_NAME}=([^;]+)`));
  return match ? match[1] : null;
}

/** Simula el inicio: devuelve la cookie, el state y el desafío que GitHub recibiría. */
async function startFlow(env) {
  const response = await worker.fetch(authRequest(), env);
  assert.equal(response.status, 302);
  const location = new URL(response.headers.get('location'));
  return {
    response,
    cookie: cookieFrom(response),
    state: location.searchParams.get('state'),
    challenge: location.searchParams.get('code_challenge'),
  };
}

let originalFetch;
beforeEach(() => {
  originalFetch = globalThis.fetch;
});
afterEach(() => {
  globalThis.fetch = originalFetch;
});

test('ruta desconocida: 404 sin reflejar la ruta', async () => {
  const response = await worker.fetch(makeRequest(`${WORKER}/otra?x=<script>`), makeEnv());
  assert.equal(response.status, 404);
  const body = await response.text();
  assert.doesNotMatch(body, /<script>/);
});

test('método distinto de GET: 405', async () => {
  const response = await worker.fetch(makeRequest(`${WORKER}/auth`, { method: 'POST' }), makeEnv());
  assert.equal(response.status, 405);
  assert.equal(response.headers.get('allow'), 'GET');
});

test('/auth redirige a GitHub con PKCE S256, state y callback del Worker', async () => {
  const { response, cookie, state, challenge } = await startFlow(makeEnv());
  const location = new URL(response.headers.get('location'));
  assert.equal(location.origin + location.pathname, 'https://github.com/login/oauth/authorize');
  assert.equal(location.searchParams.get('client_id'), CLIENT_ID);
  assert.equal(location.searchParams.get('redirect_uri'), `${WORKER}/callback`);
  assert.equal(location.searchParams.get('scope'), 'repo');
  assert.equal(location.searchParams.get('code_challenge_method'), 'S256');
  assert.ok(state && state.length >= 43);
  assert.ok(challenge && challenge.length === 43);
  assert.ok(cookie, 'debe fijar la cookie de transacción');
  assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('/auth ignora un client_id enviado por el navegador', async () => {
  const response = await worker.fetch(
    authRequest('provider=github&scope=repo&client_id=atacante0001'),
    makeEnv(),
  );
  const location = new URL(response.headers.get('location'));
  assert.equal(location.searchParams.get('client_id'), CLIENT_ID);
});

test('/auth rechaza un Referer de origen no autorizado', async () => {
  const response = await worker.fetch(
    authRequest(undefined, { referer: 'https://evil.example/' }),
    makeEnv(),
  );
  assert.equal(response.status, 403);
  assert.equal(response.headers.get('location'), null);
});

test('/auth rechaza proveedores y alcances no permitidos', async () => {
  const env = makeEnv();
  const badProvider = await worker.fetch(authRequest('provider=gitlab&scope=repo'), env);
  assert.equal(badProvider.status, 400);
  const badScope = await worker.fetch(authRequest('provider=github&scope=admin:org'), env);
  assert.equal(badScope.status, 400);
});

test('/auth responde 503 si la aplicación no tiene secreto configurado', async () => {
  const env = makeEnv({ GITHUB_CLIENT_SECRET_PROD: '' });
  const response = await worker.fetch(authRequest(), env);
  assert.equal(response.status, 503);
});

test('/auth responde 500 genérico si falta la clave de estado', async () => {
  const env = makeEnv({ OAUTH_STATE_KEY: undefined });
  const response = await worker.fetch(authRequest(), env);
  assert.equal(response.status, 500);
  assert.doesNotMatch(await response.text(), /OAUTH_STATE_KEY/);
});

test('/callback sin cookie de transacción: 400 y cookie limpia', async () => {
  const response = await worker.fetch(
    makeRequest(`${WORKER}/callback?code=abc123&state=x`),
    makeEnv(),
  );
  assert.equal(response.status, 400);
  assert.match(response.headers.get('set-cookie') ?? '', /Max-Age=0/);
});

test('/callback con state distinto al de la cookie: 400 y no llama a GitHub', async () => {
  const env = makeEnv();
  const { cookie } = await startFlow(env);
  let called = false;
  globalThis.fetch = async () => {
    called = true;
    return new Response('{}');
  };
  const response = await worker.fetch(
    makeRequest(`${WORKER}/callback?code=abc123&state=${'z'.repeat(43)}`, {
      headers: { cookie: `${STATE_COOKIE_NAME}=${cookie}` },
    }),
    env,
  );
  assert.equal(response.status, 400);
  assert.equal(called, false);
});

test('/callback con error de GitHub: 400 sin llamar al canje', async () => {
  const env = makeEnv();
  const { cookie, state } = await startFlow(env);
  let called = false;
  globalThis.fetch = async () => {
    called = true;
    return new Response('{}');
  };
  const response = await worker.fetch(
    makeRequest(`${WORKER}/callback?error=access_denied&state=${state}`, {
      headers: { cookie: `${STATE_COOKIE_NAME}=${cookie}` },
    }),
    env,
  );
  assert.equal(response.status, 400);
  assert.equal(called, false);
});

test('flujo completo: el code_verifier del canje corresponde al code_challenge inicial', async () => {
  const env = makeEnv();
  const { cookie, state, challenge } = await startFlow(env);

  let tokenBody = null;
  globalThis.fetch = async (url, init) => {
    assert.equal(url, 'https://github.com/login/oauth/access_token');
    tokenBody = new URLSearchParams(init.body);
    return new Response(
      JSON.stringify({ access_token: 'gho_TOKEN_DE_PRUEBA', token_type: 'bearer' }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      },
    );
  };

  const response = await worker.fetch(
    makeRequest(`${WORKER}/callback?code=codigo_de_prueba&state=${state}`, {
      headers: { cookie: `${STATE_COOKIE_NAME}=${cookie}` },
    }),
    env,
  );

  assert.equal(response.status, 200);
  assert.equal(tokenBody.get('client_secret'), CLIENT_SECRET);
  assert.equal(tokenBody.get('code'), 'codigo_de_prueba');
  assert.equal(tokenBody.get('redirect_uri'), `${WORKER}/callback`);
  assert.equal(await pkceChallenge(tokenBody.get('code_verifier')), challenge);

  const html = await response.text();
  assert.match(html, /gho_TOKEN_DE_PRUEBA/);
  assert.match(html, /https:\/\/deusstellaris\.github\.io/);
  assert.doesNotMatch(html, new RegExp(CLIENT_SECRET));
  assert.match(response.headers.get('content-security-policy'), /script-src 'nonce-/);
  assert.doesNotMatch(response.headers.get('content-security-policy'), /unsafe/);
  assert.match(response.headers.get('set-cookie'), /Max-Age=0/);
});

test('fallo del canje: 502 con mensaje genérico, sin token ni detalles de GitHub', async () => {
  const env = makeEnv();
  const { cookie, state } = await startFlow(env);
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({ error: 'bad_verification_code', error_description: 'detalle interno' }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      },
    );

  const response = await worker.fetch(
    makeRequest(`${WORKER}/callback?code=codigo_malo&state=${state}`, {
      headers: { cookie: `${STATE_COOKIE_NAME}=${cookie}` },
    }),
    env,
  );
  assert.equal(response.status, 502);
  const body = await response.text();
  assert.doesNotMatch(body, /detalle interno/);
  assert.doesNotMatch(body, /bad_verification_code/);
});

test('transacción caducada: 400 aunque la cookie esté bien cifrada', async () => {
  const env = makeEnv();
  const key = await importStateKey(env.OAUTH_STATE_KEY);
  const old = await sealState(key, { s: 'a'.repeat(43), v: 'v'.repeat(43), a: 'production', t: 1 });
  const response = await worker.fetch(
    makeRequest(`${WORKER}/callback?code=abc123&state=${'a'.repeat(43)}`, {
      headers: { cookie: `${STATE_COOKIE_NAME}=${old}` },
    }),
    env,
  );
  assert.equal(response.status, 400);
});

test('límite de frecuencia configurado: 429 antes de procesar', async () => {
  const env = makeEnv({
    AUTH_RATE_LIMITER: { limit: async () => ({ success: false }) },
  });
  const response = await worker.fetch(authRequest(), env);
  assert.equal(response.status, 429);
  assert.equal(response.headers.get('retry-after'), '60');
});
