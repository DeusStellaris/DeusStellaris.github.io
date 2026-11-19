import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { resetCatalogCache } from '../src/catalog.js';
import { parseConsentBody } from '../src/consent.js';
import worker from '../src/index.js';
import { LEGAL_VERSIONS } from '../src/legal-versions.js';

const ORIGIN = 'https://DeusStellaris.github.io';
const API = 'https://deus-likes-api.example.workers.dev';
const VISITOR = '3f2c9a8e-1b4d-4c7e-9f0a-2d6e8b7c5a14';
const DB_TIME = '2026-11-05T12:00:00.000Z';

const env = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-test-key',
  VISITOR_HASH_PEPPER: 'p'.repeat(40),
  SITE_INDEX_URL: 'https://DeusStellaris.github.io/search-index.json',
  ALLOWED_ORIGINS: 'https://DeusStellaris.github.io',
};

function makeRequest(
  body,
  { origin = ORIGIN, contentType = 'application/json', path = '/consent', method = 'POST' } = {},
) {
  const headers = new Headers({ 'cf-connecting-ip': '203.0.113.9' });
  if (origin) headers.set('origin', origin);
  if (contentType) headers.set('content-type', contentType);
  const text = typeof body === 'string' ? body : JSON.stringify(body);
  return { url: `${API}${path}`, method, headers, text: async () => text };
}

function validConsent(overrides = {}) {
  return {
    type: 'terms',
    granted: true,
    documentVersion: LEGAL_VERSIONS.terms,
    locale: 'es',
    visitorId: VISITOR,
    ...overrides,
  };
}

/** Simula Supabase: límite de frecuencia y la inserción que devuelve la hora de la base de datos. */
function installFetch({
  allowRate = true,
  insertStatus = 201,
  insertBody = [{ accepted_at: DB_TIME }],
} = {}) {
  const calls = [];
  globalThis.fetch = async (url, init = {}) => {
    calls.push({
      url: String(url),
      method: init.method ?? 'GET',
      body: init.body,
      headers: init.headers ?? {},
    });
    const target = String(url);
    if (target.includes('/rpc/consume_rate_limit')) {
      return new Response(JSON.stringify(allowRate), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    if (target.includes('/rest/v1/legal_consents')) {
      return new Response(JSON.stringify(insertBody), {
        status: insertStatus,
        headers: { 'content-type': 'application/json' },
      });
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

test('la versión del servidor coincide con src/config/legal.json del sitio', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const legal = JSON.parse(readFileSync(join(here, '../../../src/config/legal.json'), 'utf8'));
  // Solo los documentos con consentimiento registrado en el servidor. La política de reembolso
  // figura en legal.versions para mostrar su versión, pero no es un consentimiento.
  assert.deepEqual(
    {
      terms: LEGAL_VERSIONS.terms,
      privacy: LEGAL_VERSIONS.privacy,
      cookies: LEGAL_VERSIONS.cookies,
    },
    {
      terms: legal.versions.terms,
      privacy: legal.versions.privacy,
      cookies: legal.versions.cookies,
    },
  );
});

test('parseConsentBody acepta una aceptación válida y descarta campos de hora', () => {
  const parsed = parseConsentBody(validConsent({ acceptedAt: '1999-01-01T00:00:00.000Z' }));
  assert.ok(parsed);
  assert.equal(Object.hasOwn(parsed, 'acceptedAt'), false);
});

test('parseConsentBody rechaza tipos, locales, versiones y valores fuera de lo permitido', () => {
  assert.equal(parseConsentBody(validConsent({ type: 'marketing' })), null);
  assert.equal(parseConsentBody(validConsent({ locale: 'fr' })), null);
  assert.equal(parseConsentBody(validConsent({ documentVersion: '1999-01-01.1' })), null);
  assert.equal(parseConsentBody(validConsent({ visitorId: 'no-uuid' })), null);
  assert.equal(parseConsentBody(validConsent({ granted: 'si' })), null);
  assert.equal(
    parseConsentBody(validConsent({ type: 'terms', granted: false })),
    null,
    'no se registra un rechazo como aceptación',
  );
  assert.equal(parseConsentBody(null), null);
  assert.equal(parseConsentBody(['array']), null);
});

test('la publicidad admite conceder o retirar, con la versión de cookies', () => {
  const grant = parseConsentBody({
    ...validConsent(),
    type: 'cookies_ads',
    granted: true,
    documentVersion: LEGAL_VERSIONS.cookies,
  });
  const revoke = parseConsentBody({
    ...validConsent(),
    type: 'cookies_ads',
    granted: false,
    documentVersion: LEGAL_VERSIONS.cookies,
  });
  assert.ok(grant);
  assert.ok(revoke);
});

test('aceptación válida: 201 con la hora que devuelve la base de datos, no la del cliente', async () => {
  const calls = installFetch();
  const response = await worker.fetch(
    makeRequest(validConsent({ acceptedAt: '1999-01-01T00:00:00.000Z' })),
    env,
  );
  assert.equal(response.status, 201);
  const body = await response.json();
  assert.deepEqual(body, { type: 'terms', registered: true, acceptedAt: DB_TIME });

  const insert = calls.find((call) => call.url.includes('/rest/v1/legal_consents'));
  assert.ok(insert);
  assert.match(insert.headers.Prefer, /return=representation/);
  const row = JSON.parse(insert.body)[0];
  assert.equal(row.consent_type, 'terms');
  assert.equal(row.document_version, LEGAL_VERSIONS.terms);
  assert.equal(row.session_hash.length, 64);
  assert.equal(Object.hasOwn(row, 'accepted_at'), false, 'la hora la pone la base de datos');
  assert.doesNotMatch(insert.body, new RegExp(VISITOR), 'nunca el identificador en claro');
});

test('versión de documento inválida: 400 sin llamar a la base de datos', async () => {
  const calls = installFetch();
  const response = await worker.fetch(
    makeRequest(validConsent({ documentVersion: '0000-00-00.0' })),
    env,
  );
  assert.equal(response.status, 400);
  assert.equal(
    calls.some((call) => call.url.includes('/rest/v1/')),
    false,
  );
});

test('origen no permitido: 403', async () => {
  installFetch();
  const response = await worker.fetch(
    makeRequest(validConsent(), { origin: 'https://evil.example' }),
    env,
  );
  assert.equal(response.status, 403);
});

test('límite de frecuencia agotado: 429 sin escribir', async () => {
  const calls = installFetch({ allowRate: false });
  const response = await worker.fetch(makeRequest(validConsent()), env);
  assert.equal(response.status, 429);
  assert.equal(
    calls.some((call) => call.url.includes('/rest/v1/legal_consents')),
    false,
  );
});

test('la base de datos no devuelve una hora válida: 502, nunca se inventa una', async () => {
  installFetch({ insertBody: [{ accepted_at: 'ayer' }] });
  const response = await worker.fetch(makeRequest(validConsent()), env);
  assert.equal(response.status, 502);
  const body = await response.json();
  assert.equal(body.acceptedAt, undefined);
});

test('fallo de escritura: 502 genérico, sin detalles', async () => {
  installFetch({
    insertStatus: 500,
    insertBody: { message: 'detalle interno de la base de datos' },
  });
  const response = await worker.fetch(makeRequest(validConsent()), env);
  assert.equal(response.status, 502);
  assert.doesNotMatch(await response.text(), /detalle interno/);
});

test('preflight CORS de /consent desde origen permitido', async () => {
  const response = await worker.fetch(
    makeRequest(undefined, { path: '/consent', method: 'OPTIONS' }),
    env,
  );
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('access-control-allow-origin'), new URL(ORIGIN).origin);
});

test('cuerpo JSON mal formado: 400', async () => {
  installFetch();
  const response = await worker.fetch(makeRequest('{no es json'), env);
  assert.equal(response.status, 400);
});
