import assert from 'node:assert/strict';
import { test } from 'node:test';
import { detectOs } from '../../src/features/deusdeck/os-detect.ts';
import {
  filterResources,
  installUrl,
  normalizeResources,
  safeUrl,
} from '../../src/features/hub/hub-core.ts';
import { debounce } from '../../src/lib/debounce.ts';
import { fill } from '../../src/lib/fill.ts';

const UA = {
  windows: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130 Safari/537.36',
  mac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15',
  linux: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/130 Safari/537.36',
  iphone:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
  android:
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/130 Mobile Safari/537.36',
};

test('detecta Windows, macOS y Linux de escritorio', () => {
  assert.equal(detectOs(UA.windows), 'windows');
  assert.equal(detectOs(UA.mac), 'mac');
  assert.equal(detectOs(UA.linux), 'linux');
});

test('celulares y iPad (que se anuncia como Mac táctil) no cuentan como escritorio', () => {
  assert.equal(detectOs(UA.iphone), 'other');
  assert.equal(detectOs(UA.android), 'other');
  assert.equal(detectOs(UA.mac, 5), 'other');
  assert.equal(detectOs(''), 'other');
});

const valid = (overrides = {}) => ({
  id: 'tema-violeta',
  category: 'themes',
  name: { es: 'Tema Violeta', en: 'Violet Theme' },
  description: { es: 'Un tema oscuro con acentos violeta', en: 'A dark theme with violet accents' },
  author: 'Deus',
  version: '1.0.0',
  minAppVersion: '1.0',
  previewUrl: '/hub/previews/tema-violeta.webp',
  downloadUrl: 'https://example.com/tema.zip',
  installable: true,
  ...overrides,
});

test('el catálogo vacío o roto no produce recursos', () => {
  assert.deepEqual(normalizeResources({ resources: [] }), []);
  for (const raw of [null, undefined, 'x', {}, { resources: 'x' }, []]) {
    assert.deepEqual(normalizeResources(raw), []);
  }
});

test('descarta recursos con forma inválida y ids repetidos', () => {
  const resources = normalizeResources({
    resources: [
      valid(),
      valid(),
      valid({ id: 'Mal Id' }),
      valid({ id: 'otra', category: 'musica' }),
      valid({ id: 'sin-es', name: { en: 'Only English' } }),
      valid({ id: 'version', version: 'v1' }),
      null,
    ],
  });
  assert.deepEqual(
    resources.map((resource) => resource.id),
    ['tema-violeta'],
  );
});

test('solo admite rutas del sitio y URLs https para vista previa y descarga', () => {
  assert.equal(safeUrl('/hub/a.webp'), '/hub/a.webp');
  assert.equal(safeUrl('https://example.com/a.zip'), 'https://example.com/a.zip');
  for (const bad of [
    'javascript:alert(1)',
    'data:text/html,x',
    'http://example.com/a',
    '//evil.com/a',
    '/\\evil',
    'https://u:p@example.com/',
  ]) {
    assert.equal(safeUrl(bad), null, bad);
  }
  const [resource] = normalizeResources({
    resources: [valid({ previewUrl: 'javascript:alert(1)' })],
  });
  assert.equal(resource.previewUrl, null);
});

test('filtra por categoría y busca sin distinguir tildes ni mayúsculas, en el idioma activo', () => {
  const resources = normalizeResources({
    resources: [
      valid(),
      valid({
        id: 'iconos-neon',
        category: 'icons',
        name: { es: 'Íconos neón', en: 'Neon icons' },
        description: { es: 'Set vectorial', en: 'Vector set' },
        author: 'Ana',
      }),
    ],
  });
  const find = (filter) =>
    filterResources(resources, { category: 'all', query: '', locale: 'es', ...filter }).map(
      (r) => r.id,
    );

  assert.deepEqual(find({}), ['tema-violeta', 'iconos-neon']);
  assert.deepEqual(find({ category: 'icons' }), ['iconos-neon']);
  assert.deepEqual(find({ query: 'ICONOS' }), ['iconos-neon']);
  assert.deepEqual(find({ query: 'ana' }), ['iconos-neon']);
  assert.deepEqual(find({ query: 'oscuro violeta' }), ['tema-violeta']);
  assert.deepEqual(find({ query: 'neon', locale: 'en' }), ['iconos-neon']);
  assert.deepEqual(find({ query: 'inexistente' }), []);
  assert.deepEqual(find({ category: 'themes', query: 'ana' }), []);
});

test('el enlace de instalación usa el protocolo deusdeck:// con el id codificado', () => {
  assert.equal(installUrl('tema-violeta'), 'deusdeck://install?id=tema-violeta');
});

test('fill reemplaza marcadores y deja intactos los que no tienen valor', () => {
  assert.equal(fill('{n} recursos de {x}', { n: 3 }), '3 recursos de {x}');
});

test('debounce ejecuta una sola vez con el último valor', async () => {
  const calls = [];
  const wait = debounce((value) => calls.push(value), 20);
  wait('a');
  wait('b');
  wait('c');
  await new Promise((resolve) => setTimeout(resolve, 60));
  assert.deepEqual(calls, ['c']);
});
