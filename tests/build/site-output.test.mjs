// Verificación del sitio generado (requiere `npm run build` previo; lo ejecuta el CI).

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { test } from 'node:test';

const DIST = new URL('../../dist/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const ads = JSON.parse(readFileSync(new URL('../../src/config/ads.json', import.meta.url), 'utf8'));

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const FILES = walk(DIST).filter((file) => !relative(DIST, file).startsWith('admin'));
const HTML = FILES.filter((file) => file.endsWith('.html'));
const read = (path) => readFileSync(join(DIST, path), 'utf8');

const LEGAL_PAGES = {
  es: ['terminos', 'privacidad', 'cookies'],
  en: ['en/terms', 'en/privacy', 'en/cookies'],
};
const ES_NOTICE = 'PENDIENTE DE REVISIÓN LEGAL — BORRADOR NO DEFINITIVO';
const EN_NOTICE = 'PENDING LEGAL REVIEW — NON-FINAL DRAFT';

test('existen los seis documentos legales en español e inglés', () => {
  for (const page of [...LEGAL_PAGES.es, ...LEGAL_PAGES.en]) {
    assert.ok(existsSync(join(DIST, page, 'index.html')), `falta ${page}`);
  }
});

test('cada documento español muestra el aviso de borrador en español', () => {
  for (const page of LEGAL_PAGES.es) {
    assert.ok(read(`${page}/index.html`).includes(ES_NOTICE), `sin aviso ES en ${page}`);
  }
});

test('cada documento inglés muestra el aviso en inglés y la frase exacta en español', () => {
  for (const page of LEGAL_PAGES.en) {
    const html = read(`${page}/index.html`);
    assert.ok(html.includes(EN_NOTICE), `sin aviso EN en ${page}`);
    assert.ok(html.includes(ES_NOTICE), `sin frase exacta en ${page}`);
  }
});

test('los datos pendientes aparecen visibles en los documentos, no ocultos', () => {
  for (const page of [...LEGAL_PAGES.es, ...LEGAL_PAGES.en]) {
    const html = read(`${page}/index.html`);
    assert.match(
      html,
      /<mark class="legal__pending"/,
      `sin marcadores pendientes visibles en ${page}`,
    );
  }
});

test('el aviso no está oculto por estilos ni dentro del pie de página', () => {
  for (const page of [...LEGAL_PAGES.es, ...LEGAL_PAGES.en]) {
    const html = read(`${page}/index.html`);
    const footerStart = html.indexOf('<footer');
    const noticeAt = html.indexOf('legal__notice');
    assert.ok(
      noticeAt > 0 && (footerStart < 0 || noticeAt < footerStart),
      `aviso fuera de lugar en ${page}`,
    );
    assert.doesNotMatch(html, /legal__notice[^>]*hidden/);
  }
});

test('ninguna página HTML usa atributos style= (la CSP no lo permite)', () => {
  for (const file of HTML) {
    assert.doesNotMatch(read(relative(DIST, file)), / style="/, `style= en ${file}`);
  }
});

test('no hay scripts inline: el bootstrap es un módulo externo', () => {
  for (const file of HTML) {
    const html = read(relative(DIST, file));
    assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)[^>]*>\s*[^<\s]/, `script inline en ${file}`);
  }
});

test('la CSP no contiene unsafe-inline ni unsafe-eval', () => {
  for (const file of HTML) {
    const csp =
      read(relative(DIST, file)).match(
        /http-equiv="content-security-policy" content="([^"]*)"/,
      )?.[1] ?? '';
    assert.ok(csp.length > 0, `sin CSP en ${file}`);
    assert.doesNotMatch(csp, /unsafe-inline|unsafe-eval/, file);
  }
});

test('con la publicidad apagada no aparece ningún dominio de Google ni marcado publicitario', () => {
  if (ads.enabled === true) return; // La prueba aplica solo con la publicidad desactivada.
  for (const file of HTML) {
    const html = read(relative(DIST, file));
    assert.doesNotMatch(html, /googlesyndication|doubleclick|adsbygoogle/, file);
    assert.doesNotMatch(html, /class="ad-slot/, file);
  }
});

test('ningún secreto del servidor aparece en el sitio publicado', () => {
  const secrets = [
    /SUPABASE_SERVICE_ROLE/,
    /service_role/,
    /VISITOR_HASH_PEPPER/,
    /GITHUB_CLIENT_SECRET/,
    /OAUTH_STATE_KEY/,
  ];
  for (const file of FILES.filter((f) => /\.(html|js|json|css)$/.test(f))) {
    const content = readFileSync(file, 'utf8');
    for (const pattern of secrets) {
      assert.doesNotMatch(content, pattern, `${pattern} en ${relative(DIST, file)}`);
    }
  }
});

test('no se publican mapas de código fuente', () => {
  assert.equal(FILES.filter((file) => file.endsWith('.map')).length, 0);
});

test('el hash del script de la CSP coincide cuando hay scripts inline (si los hubiera)', () => {
  for (const file of HTML) {
    const html = read(relative(DIST, file));
    const csp = html.match(/http-equiv="content-security-policy" content="([^"]*)"/)?.[1] ?? '';
    for (const match of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)) {
      const hash = `sha256-${createHash('sha256').update(match[1], 'utf8').digest('base64')}`;
      assert.ok(csp.includes(hash), `hash ausente para un script inline en ${file}`);
    }
  }
});

test('el sitio publicado no contiene secretos de servidor', () => {
  const SECRET =
    /service_role|SERVICE_ROLE_KEY|sb_secret_|VISITOR_HASH_PEPPER|ACCOUNT_TOKEN_SECRET|VAPID_PRIVATE|PRIVATE KEY-----|ghp_[A-Za-z0-9]{20,}/;
  const TEXT = /\.(html|js|mjs|css|json|txt|xml|webmanifest)$/;
  const leaks = FILES.filter((file) => TEXT.test(file) && SECRET.test(readFileSync(file, 'utf8')));
  assert.deepEqual(
    leaks.map((file) => relative(DIST, file)),
    [],
  );
});

test('_headers publica cabeceras de seguridad estrictas y caché inmutable para /_astro', () => {
  const headers = read('_headers');
  for (const rule of [
    "frame-ancestors 'none'",
    'X-Frame-Options: DENY',
    'X-Content-Type-Options: nosniff',
    'Referrer-Policy: strict-origin-when-cross-origin',
    'camera=()',
    'Strict-Transport-Security: max-age=',
    'max-age=31536000, immutable',
  ]) {
    assert.ok(headers.includes(rule), rule);
  }
  // Cloudflare Pages une valores repetidos: la regla global no debe fijar Cache-Control.
  const globalRule = headers.split(/^\/\*$/m)[1] ?? '';
  assert.doesNotMatch(globalRule, /Cache-Control/);
});
