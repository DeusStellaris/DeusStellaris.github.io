import assert from 'node:assert/strict';
import { test } from 'node:test';
import worker from '../src/index.js';
import { parseVitalsBody, traceIdOf } from '../src/observability.js';

const ORIGIN = 'https://DeusStellaris.github.io';
const env = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-test-key',
  VISITOR_HASH_PEPPER: 'p'.repeat(40),
  SITE_INDEX_URL: 'https://DeusStellaris.github.io/search-index.json',
  ALLOWED_ORIGINS: ORIGIN,
};

const vitals = (body, origin = ORIGIN) => ({
  url: 'https://api.example.workers.dev/vitals',
  method: 'POST',
  headers: new Headers({ 'content-type': 'text/plain', ...(origin ? { origin } : {}) }),
  text: async () => JSON.stringify(body),
});

test('parseVitalsBody acepta solo métricas, valores y rutas válidas', () => {
  const ok = { name: 'LCP', value: 1234.5678, rating: 'good', path: '/juegos/' };
  assert.deepEqual(parseVitalsBody(ok), { ...ok, value: 1234.568 });
  for (const bad of [
    { ...ok, name: 'XYZ' },
    { ...ok, value: -1 },
    { ...ok, value: Number.NaN },
    { ...ok, rating: 'meh' },
    { ...ok, path: 'https://evil.example/' },
    { ...ok, path: '/a b' },
    null,
    [],
  ]) {
    assert.equal(parseVitalsBody(bad), null);
  }
});

test('traceIdOf reutiliza el traceparent W3C o genera uno de 32 hex', () => {
  const id = '4bf92f3577b34da6a3ce929d0e0e4736';
  assert.equal(traceIdOf(`00-${id}-00f067aa0ba902b7-01`), id);
  assert.match(traceIdOf('basura'), /^[0-9a-f]{32}$/);
});

test('POST /vitals: 204 con origen permitido, 403 sin él, 400 con cuerpo inválido', async () => {
  const sample = { name: 'INP', value: 120, rating: 'good', path: '/' };
  const logged = [];
  const original = console.log;
  console.log = (line) => logged.push(line);
  try {
    const ok = await worker.fetch(vitals(sample), env);
    assert.equal(ok.status, 204);
    assert.match(ok.headers.get('server-timing') ?? '', /app;dur=\d+/);
    assert.equal((await worker.fetch(vitals(sample, null), env)).status, 403);
    assert.equal((await worker.fetch(vitals({ ...sample, name: 'x' }), env)).status, 400);
  } finally {
    console.log = original;
  }
  assert.equal(JSON.parse(logged[0]).event, 'rum');
});

test('toda respuesta de la API lleva las cabeceras de seguridad estrictas', async () => {
  const response = await worker.fetch(
    { url: 'https://api.example.workers.dev/nada', method: 'GET', headers: new Headers() },
    env,
  );
  assert.equal(response.status, 404);
  const expected = {
    'x-frame-options': 'DENY',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'no-referrer',
    'content-security-policy': "default-src 'none'; frame-ancestors 'none'",
  };
  for (const [name, value] of Object.entries(expected))
    assert.equal(response.headers.get(name), value);
  assert.match(response.headers.get('permissions-policy') ?? '', /camera=\(\)/);
  assert.match(response.headers.get('strict-transport-security') ?? '', /max-age=\d+/);
});
