import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { resetCatalogCache } from '../src/catalog.js';
import worker from '../src/index.js';
import { MAX_COMMENT_LENGTH, parseReviewBody, sanitizeComment } from '../src/reviews.js';

const ORIGIN = 'https://DeusStellaris.github.io';
const API = 'https://deus-likes-api.example.workers.dev';
const VISITOR = '3f2c9a8e-1b4d-4c7e-9f0a-2d6e8b7c5a14';
const DEMOS_URL = 'https://DeusStellaris.github.io/demos-index.json';

const env = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-test-key',
  VISITOR_HASH_PEPPER: 'p'.repeat(40),
  SITE_INDEX_URL: 'https://DeusStellaris.github.io/search-index.json',
  DEMOS_INDEX_URL: DEMOS_URL,
  ALLOWED_ORIGINS: 'https://DeusStellaris.github.io',
};

function makeRequest(body, { method = 'POST', origin = ORIGIN, query = '' } = {}) {
  const headers = new Headers({
    'cf-connecting-ip': '203.0.113.9',
    'content-type': 'application/json',
  });
  if (origin) headers.set('origin', origin);
  return {
    url: `${API}/reviews${query}`,
    method,
    headers,
    text: async () => JSON.stringify(body),
  };
}

const valid = (overrides = {}) => ({
  slug: 'demo-uno',
  visitorId: VISITOR,
  rating: 5,
  comment: 'Muy divertida',
  locale: 'es',
  ...overrides,
});

/** Simula el índice de demos y Supabase (límite de frecuencia, reseñas y estadísticas). */
function installFetch({ allowRate = true, writeStatus = 201 } = {}) {
  const calls = [];
  globalThis.fetch = async (url, init = {}) => {
    const target = String(url);
    calls.push({ url: target, method: init.method ?? 'GET', body: init.body });
    const json = (body, status = 200) => new Response(JSON.stringify(body), { status });
    if (target === DEMOS_URL) return json({ slugs: ['demo-uno'] });
    if (target.includes('/rpc/consume_rate_limit')) return json(allowRate);
    if (target.includes('/rpc/review_stats'))
      return json([{ review_count: 2, average_rating: 4.5 }]);
    if (target.includes('/rest/v1/reviews') && (init.method ?? 'GET') === 'GET') {
      return json([
        { rating: 5, comment: 'Genial', locale: 'es', created_at: '2026-11-19T10:00:00Z' },
      ]);
    }
    if (target.includes('/rest/v1/reviews')) return new Response(null, { status: writeStatus });
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

test('el comentario queda como texto plano: sin etiquetas ni caracteres de control', () => {
  assert.equal(sanitizeComment('<script>alert(1)</script>Hola <b>mundo</b>'), 'alert(1)Hola mundo');
  assert.equal(sanitizeComment('a\u0000b‮c  d'), 'ab' + 'c d');
  assert.equal(sanitizeComment('x < y > z'), 'x z');
  assert.equal(sanitizeComment('2 < 3'), '2 3');
  assert.equal(sanitizeComment('l1\n\n\n\nl2'), 'l1\n\nl2');
});

test('valida puntuación, idioma, visitante, slug y largo del comentario', () => {
  assert.ok(parseReviewBody(valid()));
  assert.equal(parseReviewBody(valid({ rating: 0 })), null);
  assert.equal(parseReviewBody(valid({ rating: 6 })), null);
  assert.equal(parseReviewBody(valid({ rating: 4.5 })), null);
  assert.equal(parseReviewBody(valid({ rating: '5' })), null);
  assert.equal(parseReviewBody(valid({ locale: 'fr' })), null);
  assert.equal(parseReviewBody(valid({ visitorId: 'no-uuid' })), null);
  assert.equal(parseReviewBody(valid({ slug: '../x' })), null);
  assert.equal(parseReviewBody(valid({ comment: 'a'.repeat(MAX_COMMENT_LENGTH + 1) })), null);
  assert.equal(parseReviewBody(valid({ comment: 7 })), null);
  assert.equal(parseReviewBody(valid({ comment: undefined }))?.comment, '');
});

test('POST /reviews guarda la reseña saneada con un hash del visitante', async () => {
  const calls = installFetch();
  const response = await worker.fetch(
    makeRequest(valid({ comment: '<img src=x onerror=alert(1)>Buenísima' })),
    env,
  );
  assert.equal(response.status, 200);
  const write = calls.find(
    (call) => call.method === 'POST' && call.url.includes('/rest/v1/reviews'),
  );
  assert.ok(write?.url.includes('on_conflict=demo_slug,visitor_hash'));
  const row = JSON.parse(write.body)[0];
  assert.equal(row.comment, 'Buenísima');
  assert.match(row.visitor_hash, /^[0-9a-f]{64}$/);
  assert.notEqual(row.visitor_hash, VISITOR);
});

test('una demo inexistente no admite reseñas (404) y no escribe nada', async () => {
  const calls = installFetch();
  const response = await worker.fetch(makeRequest(valid({ slug: 'inventada' })), env);
  assert.equal(response.status, 404);
  assert.equal(
    calls.some((call) => call.url.includes('/rest/v1/reviews')),
    false,
  );
});

test('origen no permitido: 403; sin índice de demos configurado: 503', async () => {
  installFetch();
  assert.equal(
    (await worker.fetch(makeRequest(valid(), { origin: 'https://evil.example' }), env)).status,
    403,
  );
  const { DEMOS_INDEX_URL, ...withoutIndex } = env;
  assert.equal((await worker.fetch(makeRequest(valid()), withoutIndex)).status, 503);
});

test('límite de frecuencia agotado: 429; fallo de base de datos: 502 genérico', async () => {
  installFetch({ allowRate: false });
  assert.equal((await worker.fetch(makeRequest(valid()), env)).status, 429);
  installFetch({ writeStatus: 500 });
  const response = await worker.fetch(makeRequest(valid()), env);
  assert.equal(response.status, 502);
  assert.doesNotMatch(await response.text(), /supabase|http_500/i);
});

test('GET /reviews devuelve estadísticas y reseñas sin datos del visitante', async () => {
  installFetch();
  const response = await worker.fetch(
    makeRequest(null, { method: 'GET', query: '?slug=demo-uno' }),
    env,
  );
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.count, 2);
  assert.equal(body.average, 4.5);
  assert.deepEqual(Object.keys(body.reviews[0]).sort(), [
    'comment',
    'createdAt',
    'locale',
    'rating',
  ]);
});

test('GET /reviews con slug inválido: 400', async () => {
  installFetch();
  const response = await worker.fetch(
    makeRequest(null, { method: 'GET', query: '?slug=../etc' }),
    env,
  );
  assert.equal(response.status, 400);
});

test('GET /reviews pagina con offset, informa hasMore y es cacheable', async () => {
  const calls = installFetch();
  const response = await worker.fetch(
    makeRequest(null, { method: 'GET', query: '?slug=demo-uno&offset=10' }),
    env,
  );
  assert.equal(response.status, 200);
  assert.match(response.headers.get('cache-control') ?? '', /max-age=15/);
  assert.equal((await response.json()).hasMore, false);
  const list = calls.find((call) => call.url.includes('/rest/v1/reviews'));
  assert.match(list?.url ?? '', /offset=10/);
  assert.match(list?.url ?? '', /limit=11/);
});

test('GET /reviews rechaza offsets inválidos', async () => {
  installFetch();
  for (const offset of ['-1', 'x', '5000', '1.5']) {
    const response = await worker.fetch(
      makeRequest(null, { method: 'GET', query: `?slug=demo-uno&offset=${offset}` }),
      env,
    );
    assert.equal(response.status, 400);
  }
});
