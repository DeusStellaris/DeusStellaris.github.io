import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { resetCatalogCache } from '../src/catalog.js';
import { parseOrigins, readConfig } from '../src/config.js';
import { pseudonymize } from '../src/hash.js';
import worker from '../src/index.js';
import { parseLikeBody } from '../src/validation.js';

const ORIGIN = 'https://DeusStellaris.github.io';
const API = 'https://deus-likes-api.example.workers.dev';
const VISITOR = '3f2c9a8e-1b4d-4c7e-9f0a-2d6e8b7c5a14';
const SLUG = 'servidor-minecraft';

const env = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-test-key',
  VISITOR_HASH_PEPPER: 'p'.repeat(40),
  SITE_INDEX_URL: 'https://DeusStellaris.github.io/search-index.json',
  ALLOWED_ORIGINS: 'https://DeusStellaris.github.io',
};

const catalog = {
  version: 1,
  entries: [
    { id: `project:${SLUG}:es`, type: 'project' },
    { id: 'section:games:es', type: 'section' },
  ],
};

/**
 * Peticion minima con las propiedades que usa el Worker (Origin no es una cabecera
 * prohibida aqui, pero se construye igual que en la otra suite para mantener coherencia).
 */
function makeRequest(
  path,
  {
    method = 'POST',
    origin = ORIGIN,
    body,
    contentType = 'application/json',
    ip = '203.0.113.7',
  } = {},
) {
  const headers = new Headers({ 'cf-connecting-ip': ip });
  if (origin) headers.set('origin', origin);
  if (contentType) headers.set('content-type', contentType);
  const text =
    body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body);
  return { url: `${API}${path}`, method, headers, text: async () => text ?? '' };
}

function validLike(overrides = {}) {
  return { slug: SLUG, visitorId: VISITOR, action: 'like', ...overrides };
}

/** Enruta las llamadas externas: catálogo, RPC de límite, likes y conteo. */
function installFetch({
  allowRate = true,
  insertStatus = 201,
  deleteStatus = 204,
  countValue = 7,
  rpcOk = true,
} = {}) {
  const calls = [];
  globalThis.fetch = async (url, init = {}) => {
    calls.push({
      url: String(url),
      method: init.method ?? 'GET',
      headers: init.headers ?? {},
      body: init.body,
    });
    const target = String(url);
    if (target.endsWith('/search-index.json')) {
      return new Response(JSON.stringify(catalog), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    if (target.includes('/rpc/consume_rate_limit')) {
      if (!rpcOk) return new Response('error', { status: 500 });
      return new Response(JSON.stringify(allowRate), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    if (target.includes('/rpc/get_like_count')) {
      return new Response(JSON.stringify(countValue), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    if (target.includes('/rest/v1/likes') && init.method === 'POST') {
      return new Response(null, { status: insertStatus });
    }
    if (target.includes('/rest/v1/likes') && init.method === 'DELETE') {
      return new Response(null, { status: deleteStatus });
    }
    return new Response('not mocked', { status: 599 });
  };
  return calls;
}

let originalFetch;
beforeEach(() => {
  originalFetch = globalThis.fetch;
  resetCatalogCache();
});
afterEach(() => {
  globalThis.fetch = originalFetch;
});

test('OPTIONS desde un origen permitido responde preflight con CORS exacto', async () => {
  installFetch();
  const response = await worker.fetch(makeRequest('/likes', { method: 'OPTIONS' }), env);
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('access-control-allow-origin'), new URL(ORIGIN).origin);
  assert.match(response.headers.get('access-control-allow-methods'), /POST/);
});

test('OPTIONS desde un origen no permitido no recibe CORS', async () => {
  installFetch();
  const response = await worker.fetch(
    makeRequest('/likes', { method: 'OPTIONS', origin: 'https://evil.example' }),
    env,
  );
  assert.equal(response.status, 403);
  assert.equal(response.headers.get('access-control-allow-origin'), null);
});

test('sin cabecera Origin la petición se rechaza', async () => {
  installFetch();
  const response = await worker.fetch(
    makeRequest('/likes', { origin: null, body: validLike() }),
    env,
  );
  assert.equal(response.status, 403);
});

test('un origen parecido pero distinto se rechaza', async () => {
  installFetch();
  const response = await worker.fetch(
    makeRequest('/likes', {
      origin: 'https://DeusStellaris.github.io.evil.example',
      body: validLike(),
    }),
    env,
  );
  assert.equal(response.status, 403);
});

test('solo POST y OPTIONS en /likes; otras rutas dan 404', async () => {
  installFetch();
  assert.equal((await worker.fetch(makeRequest('/likes', { method: 'GET' }), env)).status, 405);
  assert.equal((await worker.fetch(makeRequest('/otra', { body: validLike() }), env)).status, 404);
});

test('cuerpo inválido: slug, visitante, acción o tipo de contenido erróneos dan 400', async () => {
  installFetch();
  const cases = [
    { slug: '../../etc', visitorId: VISITOR, action: 'like' },
    { slug: SLUG, visitorId: 'no-es-uuid', action: 'like' },
    { slug: SLUG, visitorId: VISITOR, action: 'delete' },
    { slug: 123, visitorId: VISITOR, action: 'like' },
  ];
  for (const body of cases) {
    const response = await worker.fetch(makeRequest('/likes', { body }), env);
    assert.equal(response.status, 400, JSON.stringify(body));
  }
  const wrongType = await worker.fetch(
    makeRequest('/likes', { body: validLike(), contentType: 'text/plain' }),
    env,
  );
  assert.equal(wrongType.status, 400);
  const broken = await worker.fetch(makeRequest('/likes', { body: '{no json' }), env);
  assert.equal(broken.status, 400);
});

test('cuerpo demasiado grande se rechaza', async () => {
  installFetch();
  const huge = JSON.stringify({ ...validLike(), extra: 'x'.repeat(2000) });
  const response = await worker.fetch(makeRequest('/likes', { body: huge }), env);
  assert.equal(response.status, 400);
});

test('un slug que no está publicado devuelve 404 sin tocar la base de datos', async () => {
  const calls = installFetch();
  const response = await worker.fetch(
    makeRequest('/likes', { body: validLike({ slug: 'no-existe' }) }),
    env,
  );
  assert.equal(response.status, 404);
  assert.equal(
    calls.some((call) => call.url.includes('/rest/v1/')),
    false,
  );
});

test('like válido: inserta con hash del visitante, nunca el UUID en claro', async () => {
  const calls = installFetch({ countValue: 8 });
  const response = await worker.fetch(makeRequest('/likes', { body: validLike() }), env);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body, { slug: SLUG, likes: 8, liked: true });

  const insert = calls.find(
    (call) => call.url.includes('/rest/v1/likes') && call.method === 'POST',
  );
  assert.ok(insert, 'debe insertar el like');
  assert.match(insert.headers.Prefer, /ignore-duplicates/);
  const payload = JSON.parse(insert.body)[0];
  assert.equal(payload.project_slug, SLUG);
  assert.equal(payload.visitor_hash.length, 64);
  assert.doesNotMatch(insert.body, new RegExp(VISITOR));
  const expected = await pseudonymize(env.VISITOR_HASH_PEPPER, 'visitor', VISITOR);
  assert.equal(payload.visitor_hash, expected);
});

test('unlike: borra con filtros eq sobre el slug y el hash del visitante', async () => {
  const calls = installFetch({ countValue: 6 });
  const response = await worker.fetch(
    makeRequest('/likes', { body: validLike({ action: 'unlike' }) }),
    env,
  );
  const body = await response.json();
  assert.equal(body.liked, false);
  const remove = calls.find((call) => call.method === 'DELETE');
  assert.ok(remove);
  assert.match(remove.url, /project_slug=eq\.servidor-minecraft/);
  assert.match(remove.url, /visitor_hash=eq\./);
});

test('límite por IP agotado: 429 con Retry-After y sin escribir', async () => {
  const calls = installFetch({ allowRate: false });
  const response = await worker.fetch(makeRequest('/likes', { body: validLike() }), env);
  assert.equal(response.status, 429);
  assert.equal(response.headers.get('retry-after'), '60');
  assert.equal(
    calls.some((call) => call.url.includes('/rest/v1/likes')),
    false,
  );
});

test('fallo de la base de datos: 502 genérico, sin detalles', async () => {
  installFetch({ rpcOk: false });
  const response = await worker.fetch(makeRequest('/likes', { body: validLike() }), env);
  assert.equal(response.status, 502);
  const text = await response.text();
  assert.doesNotMatch(text, /supabase|service|500/i);
});

test('configuración incompleta responde 503 sin revelar secretos', async () => {
  installFetch();
  const response = await worker.fetch(makeRequest('/likes', { body: validLike() }), {
    ...env,
    SUPABASE_URL: '',
  });
  assert.equal(response.status, 503);
  const text = await response.text();
  assert.doesNotMatch(text, /service-role/);
});

test('ALLOWED_ORIGINS mal formado deja la configuración como incompleta', () => {
  assert.equal(parseOrigins('no es una url'), null);
  assert.equal(parseOrigins(''), null);
  assert.deepEqual(parseOrigins('https://a.example/, http://localhost:4321'), [
    'https://a.example',
    'http://localhost:4321',
  ]);
  assert.equal(readConfig({ ...env, ALLOWED_ORIGINS: 'no es una url' }).ok, false);
});

test('validación del cuerpo: solo acepta la forma exacta', () => {
  assert.deepEqual(parseLikeBody(validLike()), { slug: SLUG, visitorId: VISITOR, action: 'like' });
  assert.equal(parseLikeBody(['array']), null);
  assert.equal(parseLikeBody(null), null);
  assert.equal(parseLikeBody({ ...validLike(), slug: '../x' }), null);
});

test('el pseudónimo depende del secreto y del ámbito', async () => {
  const a = await pseudonymize('p'.repeat(40), 'visitor', VISITOR);
  const b = await pseudonymize('q'.repeat(40), 'visitor', VISITOR);
  const c = await pseudonymize('p'.repeat(40), 'ip', VISITOR);
  assert.notEqual(a, b);
  assert.notEqual(a, c);
  assert.equal(a.length, 64);
});
