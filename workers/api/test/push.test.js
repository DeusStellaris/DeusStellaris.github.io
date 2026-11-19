import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import worker from '../src/index.js';
import { parseSubscribeBody, parseUnsubscribeBody } from '../src/push.js';

const ORIGIN = 'https://DeusStellaris.github.io';
const API = 'https://deus-likes-api.example.workers.dev';
const ENDPOINT = 'https://fcm.googleapis.com/fcm/send/abc123def456ghi789';

const env = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-test-key',
  VISITOR_HASH_PEPPER: 'p'.repeat(40),
  SITE_INDEX_URL: 'https://DeusStellaris.github.io/search-index.json',
  ALLOWED_ORIGINS: 'https://DeusStellaris.github.io',
};

function makeRequest(body, { path = '/push/subscribe', origin = ORIGIN, method = 'POST' } = {}) {
  const headers = new Headers({
    'cf-connecting-ip': '203.0.113.9',
    'content-type': 'application/json',
  });
  if (origin) headers.set('origin', origin);
  return { url: `${API}${path}`, method, headers, text: async () => JSON.stringify(body) };
}

function validSubscribe(overrides = {}) {
  return {
    subscription: { endpoint: ENDPOINT, keys: { p256dh: 'A'.repeat(87), auth: 'B'.repeat(22) } },
    preferences: { mode: 'projects', categories: [], projects: ['deusdeck'] },
    locale: 'es',
    ...overrides,
  };
}

/** Simula Supabase: límite de frecuencia y la tabla push_subscriptions. */
function installFetch({ allowRate = true, tableStatus = 201 } = {}) {
  const calls = [];
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), method: init.method ?? 'GET', body: init.body });
    if (String(url).includes('/rpc/consume_rate_limit')) {
      return new Response(JSON.stringify(allowRate), { status: 200 });
    }
    if (String(url).includes('/rest/v1/push_subscriptions')) {
      return new Response(null, { status: tableStatus });
    }
    return new Response('not mocked', { status: 599 });
  };
  return calls;
}

let originalFetch;
beforeEach(() => {
  originalFetch = globalThis.fetch;
});
afterEach(() => {
  globalThis.fetch = originalFetch;
});

test('suscripción válida: se normaliza y se acepta', () => {
  const parsed = parseSubscribeBody(validSubscribe());
  assert.equal(parsed?.mode, 'projects');
  assert.deepEqual(parsed?.projects, ['deusdeck']);
  assert.equal(parsed?.endpoint, ENDPOINT);
});

test('rechaza endpoints inseguros o de servicios desconocidos', () => {
  for (const endpoint of [
    'http://fcm.googleapis.com/fcm/send/abc',
    'https://evil.example/push',
    'https://fcm.googleapis.com.evil.example/x',
    'https://user:pass@fcm.googleapis.com/fcm/send/abc',
    `https://fcm.googleapis.com/${'a'.repeat(600)}`,
  ]) {
    const body = validSubscribe({
      subscription: { endpoint, keys: { p256dh: 'A'.repeat(87), auth: 'B'.repeat(22) } },
    });
    assert.equal(parseSubscribeBody(body), null, endpoint);
  }
});

test('rechaza claves, modos, categorías, slugs e idiomas fuera de formato', () => {
  const invalid = [
    validSubscribe({ locale: 'fr' }),
    validSubscribe({ preferences: { mode: 'none', categories: [], projects: [] } }),
    validSubscribe({ preferences: { mode: 'categories', categories: ['musica'], projects: [] } }),
    validSubscribe({ preferences: { mode: 'projects', categories: [], projects: ['../x'] } }),
    validSubscribe({
      preferences: {
        mode: 'projects',
        categories: [],
        projects: Array.from({ length: 51 }, (_, i) => `p${i}`),
      },
    }),
    validSubscribe({
      subscription: { endpoint: ENDPOINT, keys: { p256dh: 'corta', auth: 'B'.repeat(22) } },
    }),
    'texto',
    null,
  ];
  for (const body of invalid) assert.equal(parseSubscribeBody(body), null);
});

test('baja: solo acepta un endpoint válido', () => {
  assert.deepEqual(parseUnsubscribeBody({ endpoint: ENDPOINT }), { endpoint: ENDPOINT });
  assert.equal(parseUnsubscribeBody({ endpoint: 'https://evil.example/x' }), null);
  assert.equal(parseUnsubscribeBody({}), null);
});

test('POST /push/subscribe guarda con upsert y un hash del endpoint, nunca el endpoint como clave', async () => {
  const calls = installFetch();
  const response = await worker.fetch(makeRequest(validSubscribe()), env);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { registered: true });

  const write = calls.find((call) => call.url.includes('/rest/v1/push_subscriptions'));
  assert.ok(write?.url.includes('on_conflict=endpoint_hash'));
  const row = JSON.parse(write.body)[0];
  assert.match(row.endpoint_hash, /^[0-9a-f]{64}$/);
  assert.equal(row.mode, 'projects');
  assert.deepEqual(row.projects, ['deusdeck']);
});

test('POST /push/unsubscribe borra por hash del endpoint', async () => {
  const calls = installFetch({ tableStatus: 204 });
  const response = await worker.fetch(
    makeRequest({ endpoint: ENDPOINT }, { path: '/push/unsubscribe' }),
    env,
  );
  assert.equal(response.status, 200);
  const write = calls.find((call) => call.method === 'DELETE');
  assert.match(write?.url ?? '', /endpoint_hash=eq\.[0-9a-f]{64}/);
});

test('origen no permitido: 403 sin tocar la base de datos', async () => {
  const calls = installFetch();
  const response = await worker.fetch(
    makeRequest(validSubscribe(), { origin: 'https://evil.example' }),
    env,
  );
  assert.equal(response.status, 403);
  assert.equal(calls.length, 0);
});

test('cuerpo inválido: 400; límite agotado: 429; fallo de base de datos: 502', async () => {
  installFetch();
  assert.equal((await worker.fetch(makeRequest({ foo: 1 }), env)).status, 400);

  installFetch({ allowRate: false });
  assert.equal((await worker.fetch(makeRequest(validSubscribe()), env)).status, 429);

  installFetch({ tableStatus: 500 });
  assert.equal((await worker.fetch(makeRequest(validSubscribe()), env)).status, 502);
});

test('preflight CORS de /push/subscribe desde origen permitido', async () => {
  const response = await worker.fetch(makeRequest({}, { method: 'OPTIONS' }), env);
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('access-control-allow-origin'), ORIGIN.toLowerCase());
});
