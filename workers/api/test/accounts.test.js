import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import {
  parseBackupPayload,
  parseCredentials,
  readSessionCookie,
  SESSION_COOKIE,
  signToken,
  verifyToken,
} from '../src/accounts.js';
import { hashPassword, verifyPassword } from '../src/password.js';
import worker from '../src/index.js';

const ORIGIN = 'https://DeusStellaris.github.io';
const API = 'https://deus-likes-api.example.workers.dev';
const PASSWORD = 'una contraseña larga y segura';

const env = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-test-key',
  VISITOR_HASH_PEPPER: 'p'.repeat(40),
  SITE_INDEX_URL: 'https://DeusStellaris.github.io/search-index.json',
  ALLOWED_ORIGINS: 'https://DeusStellaris.github.io',
  ACCOUNTS_ENABLED: 'true',
  ACCOUNT_TOKEN_SECRET: 's'.repeat(40),
};

function makeRequest(path, body, { method = 'POST', token, origin = ORIGIN } = {}) {
  const headers = new Headers({
    'cf-connecting-ip': '203.0.113.9',
    'content-type': 'application/json',
  });
  if (origin) headers.set('origin', origin);
  if (token) headers.set('cookie', `otra=1; ${SESSION_COOKIE}=${token}`);
  return { url: `${API}${path}`, method, headers, text: async () => JSON.stringify(body) };
}

/** Simula Supabase con una cuenta y un respaldo en memoria. */
function installFetch(state) {
  globalThis.fetch = async (url, init = {}) => {
    const target = String(url);
    const json = (body, status = 200) => new Response(JSON.stringify(body), { status });
    const method = init.method ?? 'GET';
    if (target.includes('/rpc/consume_rate_limit')) return json(state.allowRate ?? true);
    if (target.includes('/rest/v1/accounts') && method === 'POST') {
      if (state.duplicate) return new Response(null, { status: 409 });
      state.inserted = JSON.parse(init.body)[0];
      return json([{ id: 'acc-1' }], 201);
    }
    if (target.includes('/rest/v1/accounts')) return json(state.account ? [state.account] : []);
    if (target.includes('/rest/v1/profile_backups') && method === 'POST') {
      state.backup = JSON.parse(init.body)[0];
      return new Response(null, { status: 201 });
    }
    if (target.includes('/rest/v1/profile_backups')) {
      return json(
        state.backup ? [{ payload: state.backup.payload, updated_at: '2026-11-19T10:00:00Z' }] : [],
      );
    }
    return new Response('not mocked', { status: 599 });
  };
}

let originalFetch;
beforeEach(() => {
  originalFetch = globalThis.fetch;
});
afterEach(() => {
  globalThis.fetch = originalFetch;
});

test('PBKDF2: hash con sal propia, 100.000 iteraciones, que verifica y no contiene la contraseña', async () => {
  const first = await hashPassword(PASSWORD);
  const second = await hashPassword(PASSWORD);
  assert.match(first, /^\$pbkdf2-sha256\$i=100000\$[A-Za-z0-9+/]+\$[A-Za-z0-9+/]+$/);
  assert.notEqual(first, second);
  assert.equal(first.includes(PASSWORD), false);
  assert.equal(await verifyPassword(PASSWORD, first), true);
  assert.equal(await verifyPassword('otra contraseña distinta', first), false);
  assert.equal(await verifyPassword(PASSWORD, 'no-es-un-hash'), false);
  assert.equal(await verifyPassword(PASSWORD, '$pbkdf2-sha256$i=999999$AAAA$AAAA'), false);
});

test('valida el correo y exige contraseñas de 12 a 128 caracteres', () => {
  assert.deepEqual(
    parseCredentials({ email: ' Deus@Example.COM ', password: PASSWORD })?.email,
    'deus@example.com',
  );
  assert.equal(parseCredentials({ email: 'sin-arroba', password: PASSWORD }), null);
  assert.equal(parseCredentials({ email: 'a@b.co', password: 'corta' }), null);
  assert.equal(parseCredentials({ email: 'a@b.co', password: 'x'.repeat(129) }), null);
  assert.equal(parseCredentials({ email: 'a@b.co' }), null);
});

test('el token firmado caduca y no admite manipulación', async () => {
  const secret = 's'.repeat(40);
  const token = await signToken(secret, 'acc-1', 1000);
  assert.equal(await verifyToken(secret, token, 1100), 'acc-1');
  assert.equal(await verifyToken(secret, token, 1000 + 3601), null);
  assert.equal(await verifyToken('otro'.repeat(10), token, 1100), null);
  assert.equal(await verifyToken(secret, `${token}x`, 1100), null);
  assert.equal(await verifyToken(secret, '', 1100), null);
});

test('el respaldo solo admite claves conocidas y datos con forma válida', () => {
  assert.ok(parseBackupPayload({ favorites: ['deusdeck'], theme: 'dark', liteMode: true }));
  assert.equal(parseBackupPayload({ password: 'x' }), null);
  assert.equal(parseBackupPayload({ favorites: ['../x'] }), null);
  assert.equal(parseBackupPayload({ theme: 'rojo' }), null);
  assert.equal(parseBackupPayload([]), null);
});

test('apagada por defecto: sin ACCOUNTS_ENABLED todas las rutas responden 404', async () => {
  installFetch({});
  const off = { ...env, ACCOUNTS_ENABLED: undefined };
  for (const path of ['/accounts/register', '/accounts/login']) {
    assert.equal(
      (await worker.fetch(makeRequest(path, { email: 'a@b.co', password: PASSWORD }), off)).status,
      404,
    );
  }
});

test('registro: guarda solo el hash PBKDF2 y el correo como HMAC, nunca en claro', async () => {
  const state = {};
  installFetch(state);
  const response = await worker.fetch(
    makeRequest('/accounts/register', { email: 'Deus@Example.com', password: PASSWORD }),
    env,
  );
  assert.equal(response.status, 201);
  assert.match(state.inserted.password_hash, /^\$pbkdf2-sha256\$/);
  assert.match(state.inserted.email_hash, /^[0-9a-f]{64}$/);
  assert.equal(JSON.stringify(state.inserted).includes(PASSWORD), false);
  assert.equal(JSON.stringify(state.inserted).toLowerCase().includes('deus@example.com'), false);
});

test('registro: correo repetido 409 genérico; origen ajeno 403; contraseña corta 400', async () => {
  installFetch({ duplicate: true });
  const body = { email: 'a@b.co', password: PASSWORD };
  assert.equal((await worker.fetch(makeRequest('/accounts/register', body), env)).status, 409);
  assert.equal(
    (
      await worker.fetch(
        makeRequest('/accounts/register', body, { origin: 'https://evil.example' }),
        env,
      )
    ).status,
    403,
  );
  assert.equal(
    (await worker.fetch(makeRequest('/accounts/register', { ...body, password: 'corta' }), env))
      .status,
    400,
  );
});

test('login: devuelve token con la contraseña correcta y 401 idéntico si falla o no existe', async () => {
  const passwordHash = await hashPassword(PASSWORD);
  installFetch({ account: { id: 'acc-1', password_hash: passwordHash } });
  const ok = await worker.fetch(
    makeRequest('/accounts/login', { email: 'a@b.co', password: PASSWORD }),
    env,
  );
  assert.equal(ok.status, 200);
  const cookie = ok.headers.get('set-cookie') ?? '';
  for (const flag of ['HttpOnly', 'Secure', 'SameSite=Strict', 'Path=/', 'Max-Age=3600']) {
    assert.ok(cookie.includes(flag), flag);
  }
  assert.equal(
    (await ok.json()).token,
    undefined,
    'el token nunca llega al JavaScript de la página',
  );
  assert.equal(await verifyToken(env.ACCOUNT_TOKEN_SECRET, readSessionCookie(cookie)), 'acc-1');

  const wrong = await worker.fetch(
    makeRequest('/accounts/login', { email: 'a@b.co', password: 'contraseña equivocada!!' }),
    env,
  );
  installFetch({});
  const missing = await worker.fetch(
    makeRequest('/accounts/login', { email: 'x@y.co', password: PASSWORD }),
    env,
  );
  assert.equal(wrong.status, 401);
  assert.equal(missing.status, 401);
  assert.equal(await wrong.text(), await missing.text());
});

test('login: límite de frecuencia agotado devuelve 429', async () => {
  installFetch({ allowRate: false });
  assert.equal(
    (
      await worker.fetch(
        makeRequest('/accounts/login', { email: 'a@b.co', password: PASSWORD }),
        env,
      )
    ).status,
    429,
  );
});

test('respaldo: exige token y guarda solo un payload válido', async () => {
  const state = {};
  installFetch(state);
  const token = await signToken(env.ACCOUNT_TOKEN_SECRET, 'acc-1');

  assert.equal(
    (await worker.fetch(makeRequest('/accounts/backup', null, { method: 'GET' }), env)).status,
    401,
  );
  assert.equal(
    (await worker.fetch(makeRequest('/accounts/backup', null, { method: 'GET', token }), env))
      .status,
    404,
  );

  const put = await worker.fetch(
    makeRequest(
      '/accounts/backup',
      { payload: { favorites: ['deusdeck'] } },
      { method: 'PUT', token },
    ),
    env,
  );
  assert.equal(put.status, 200);
  assert.deepEqual(state.backup.payload, { favorites: ['deusdeck'] });

  const bad = await worker.fetch(
    makeRequest('/accounts/backup', { payload: { secreto: 1 } }, { method: 'PUT', token }),
    env,
  );
  assert.equal(bad.status, 400);

  const get = await worker.fetch(
    makeRequest('/accounts/backup', null, { method: 'GET', token }),
    env,
  );
  assert.deepEqual((await get.json()).payload, { favorites: ['deusdeck'] });
});

test('respaldo: rechaza el token por Authorization y las peticiones cross-site (CSRF)', async () => {
  installFetch({ account: null, backup: null });
  const token = await signToken(env.ACCOUNT_TOKEN_SECRET, 'acc-1');
  const bearer = makeRequest('/accounts/backup', null, { method: 'GET' });
  bearer.headers.set('authorization', `Bearer ${token}`);
  assert.equal((await worker.fetch(bearer, env)).status, 401);

  const crossSite = makeRequest('/accounts/backup', null, { method: 'GET', token });
  crossSite.headers.set('sec-fetch-site', 'cross-site');
  assert.equal((await worker.fetch(crossSite, env)).status, 403);
});
