import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  appByName,
  appForReferer,
  DEVELOPMENT_ORIGIN,
  isAppConfigured,
  PRODUCTION_ORIGIN,
  resolveApps,
} from '../src/config.js';
import {
  buildStateCookie,
  clearStateCookie,
  readCookie,
  STATE_COOKIE_NAME,
} from '../src/cookies.js';
import { popupCsp, STRICT_CSP } from '../src/http.js';
import { buildAuthorizeUrl } from '../src/oauth.js';
import { escapeHtml, popupSuccessPage, toScriptJson } from '../src/pages.js';
import {
  isGithubProvider,
  isTransactionFresh,
  isValidAuthorizationCode,
  isValidState,
  MAX_TRANSACTION_AGE_SECONDS,
  normalizeScope,
} from '../src/validation.js';

const VALID_CLIENT_ID = 'Iv1.abcdef123456';
const VALID_SECRET = 'a'.repeat(40);

test('sin DEV_OAUTH_ENABLED solo existe la aplicación de producción', () => {
  const apps = resolveApps({});
  assert.deepEqual(
    apps.map((app) => app.name),
    ['production'],
  );
  assert.equal(apps[0].origin, new URL(PRODUCTION_ORIGIN).origin);
});

test('con DEV_OAUTH_ENABLED=true se añade la aplicación de desarrollo', () => {
  const apps = resolveApps({ DEV_OAUTH_ENABLED: 'true' });
  assert.deepEqual(
    apps.map((app) => app.name),
    ['production', 'development'],
  );
  assert.equal(appByName(apps, 'development').origin, new URL(DEVELOPMENT_ORIGIN).origin);
});

test('appForReferer elige la aplicación por origen exacto', () => {
  const apps = resolveApps({ DEV_OAUTH_ENABLED: 'true' });
  assert.equal(appForReferer(apps, 'https://DeusStellaris.github.io/admin/')?.name, 'production');
  assert.equal(appForReferer(apps, 'http://localhost:4321/admin/')?.name, 'development');
  assert.equal(appForReferer(apps, 'https://evil.example/admin/'), null);
  assert.equal(appForReferer(apps, 'https://DeusStellaris.github.io.evil.example/'), null);
  assert.equal(appForReferer(apps, 'no es una url'), null);
});

test('sin Referer se usa producción, nunca desarrollo', () => {
  const apps = resolveApps({ DEV_OAUTH_ENABLED: 'true' });
  assert.equal(appForReferer(apps, null)?.name, 'production');
});

test('isAppConfigured exige client_id con formato y secreto no vacío', () => {
  const ok = {
    name: 'production',
    origin: PRODUCTION_ORIGIN,
    clientId: VALID_CLIENT_ID,
    clientSecret: VALID_SECRET,
  };
  assert.equal(isAppConfigured(ok), true);
  assert.equal(isAppConfigured({ ...ok, clientId: '' }), false);
  assert.equal(isAppConfigured({ ...ok, clientId: 'x y' }), false);
  assert.equal(isAppConfigured({ ...ok, clientSecret: 'corto' }), false);
  assert.equal(isAppConfigured({ ...ok, clientSecret: undefined }), false);
});

test('normalizeScope acepta solo repo y public_repo', () => {
  assert.equal(normalizeScope(null), 'repo');
  assert.equal(normalizeScope('repo'), 'repo');
  assert.equal(normalizeScope('public_repo'), 'public_repo');
  assert.equal(normalizeScope('admin:org'), null);
  assert.equal(normalizeScope('repo admin:org'), null);
});

test('isGithubProvider solo acepta github', () => {
  assert.equal(isGithubProvider('github'), true);
  assert.equal(isGithubProvider('gitlab'), false);
  assert.equal(isGithubProvider(null), false);
});

test('isValidState y isValidAuthorizationCode rechazan formatos fuera de lo esperado', () => {
  assert.equal(isValidState('a'.repeat(43)), true);
  assert.equal(isValidState('corto'), false);
  assert.equal(isValidState('con espacios y <script>'), false);
  assert.equal(isValidState(null), false);
  assert.equal(isValidAuthorizationCode('abc123_-XYZ'), true);
  assert.equal(isValidAuthorizationCode('a'.repeat(257)), false);
  assert.equal(isValidAuthorizationCode('abc;DROP'), false);
});

test('isTransactionFresh caduca transacciones antiguas y futuras', () => {
  const now = 1_700_000_000;
  assert.equal(isTransactionFresh(now, now), true);
  assert.equal(isTransactionFresh(now - MAX_TRANSACTION_AGE_SECONDS, now), true);
  assert.equal(isTransactionFresh(now - MAX_TRANSACTION_AGE_SECONDS - 1, now), false);
  assert.equal(isTransactionFresh(now + 60, now), false);
  assert.equal(isTransactionFresh('no', now), false);
});

test('la cookie de estado es __Host-, HttpOnly, Secure y SameSite=Lax', () => {
  const cookie = buildStateCookie('valor');
  assert.match(cookie, new RegExp(`^${STATE_COOKIE_NAME}=valor;`));
  assert.match(cookie, /Path=\//);
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /Secure/);
  assert.match(cookie, /SameSite=Lax/);
  assert.doesNotMatch(cookie, /Domain=/);
  assert.match(clearStateCookie(), /Max-Age=0/);
});

test('readCookie encuentra el valor entre varias cookies', () => {
  const header = `otra=1; ${STATE_COOKIE_NAME}=abc.def; tercera=3`;
  assert.equal(readCookie(header, STATE_COOKIE_NAME), 'abc.def');
  assert.equal(readCookie(header, 'inexistente'), null);
  assert.equal(readCookie(null, STATE_COOKIE_NAME), null);
});

test('escapeHtml neutraliza caracteres de HTML', () => {
  assert.equal(
    escapeHtml('<b>"x" & \'y\'</b>'),
    '&lt;b&gt;&quot;x&quot; &amp; &#39;y&#39;&lt;/b&gt;',
  );
});

test('toScriptJson impide cerrar la etiqueta script desde los datos', () => {
  const json = toScriptJson({ value: '</script><script>alert(1)</script>' });
  assert.doesNotMatch(json, /<\/script>/);
  assert.doesNotMatch(json, /</);
});

test('la página de éxito usa solo el nonce, el origen permitido y no incluye inline sin nonce', () => {
  const html = popupSuccessPage({
    token: 'tok123',
    allowedOrigins: ['https://DeusStellaris.github.io'],
    nonce: 'NONCE1',
  });
  assert.match(html, /<script nonce="NONCE1">/);
  assert.match(html, /https:\/\/DeusStellaris\.github\.io/);
  assert.equal((html.match(/<script/g) ?? []).length, 1);
  assert.match(popupCsp('NONCE1'), /script-src 'nonce-NONCE1'/);
  assert.doesNotMatch(popupCsp('NONCE1'), /unsafe/);
  assert.doesNotMatch(STRICT_CSP, /unsafe/);
});

test('buildAuthorizeUrl incluye PKCE S256 y el redirect_uri exacto', () => {
  const url = new URL(
    buildAuthorizeUrl({
      clientId: VALID_CLIENT_ID,
      redirectUri: 'https://deus-auth.example.workers.dev/callback',
      scope: 'repo',
      state: 'estado-aleatorio-1234567890',
      codeChallenge: 'desafio',
    }),
  );
  assert.equal(url.origin + url.pathname, 'https://github.com/login/oauth/authorize');
  assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
  assert.equal(url.searchParams.get('code_challenge'), 'desafio');
  assert.equal(
    url.searchParams.get('redirect_uri'),
    'https://deus-auth.example.workers.dev/callback',
  );
});
