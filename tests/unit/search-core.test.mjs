import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  normalizeText,
  scoreEntry,
  searchEntries,
  tokenize,
} from '../../src/features/search/search-core.ts';

const entry = (overrides = {}) => ({
  id: 'x',
  type: 'project',
  locale: 'es',
  title: 'Servidor de Minecraft',
  summary: 'Entorno personalizado con plugins.',
  href: '/proyectos/servidor/',
  section: 'games',
  category: 'Minecraft',
  tags: ['servidor', 'plugins'],
  ...overrides,
});

const sample = [
  entry({ id: 'a', title: 'Servidor de Minecraft', section: 'games', category: 'Minecraft' }),
  entry({
    id: 'b',
    title: 'Herramienta de Blockbench',
    section: 'programs',
    category: 'Modelado',
    tags: ['modelos'],
    summary: 'Exportador de modelos.',
  }),
  entry({
    id: 'c',
    title: 'Plugin de Unreal',
    section: 'programs',
    category: 'Unreal Engine',
    tags: [],
    summary: 'Herramienta en C++.',
  }),
  entry({
    id: 'd',
    title: 'Diseño para clientes',
    section: 'freelance',
    category: '',
    tags: ['web'],
    summary: 'Servicio profesional.',
  }),
];

test('normalizeText quita acentos, mayúsculas y espacios sobrantes', () => {
  assert.equal(normalizeText('  Modelación   Técnica  '), 'modelacion tecnica');
});

test('tokenize descarta tokens de menos de dos letras', () => {
  assert.deepEqual(tokenize('a de servidor'), ['de', 'servidor']);
});

test('scoreEntry: todos los tokens deben coincidir; si falta uno, la puntuación es 0', () => {
  assert.equal(scoreEntry(sample[0], ['servidor', 'minecraft']) > 0, true);
  assert.equal(scoreEntry(sample[0], ['servidor', 'unreal']), 0);
});

test('scoreEntry pondera el título por encima del resumen', () => {
  const inTitle = entry({ title: 'Unreal', summary: '' });
  const inSummary = entry({ title: 'Otro', summary: 'Unreal', category: '', tags: [] });
  assert.ok(scoreEntry(inTitle, ['unreal']) > scoreEntry(inSummary, ['unreal']));
});

test('búsqueda sin acentos encuentra palabras con acentos', () => {
  const outcome = searchEntries(sample, 'diseno');
  assert.equal(outcome.status, 'results');
  assert.deepEqual(
    outcome.results.map((item) => item.id),
    ['d'],
  );
});

test('consulta corta devuelve pista, sin resultados', () => {
  assert.deepEqual(searchEntries(sample, 'a'), { status: 'hint' });
  assert.deepEqual(searchEntries(sample, '   '), { status: 'hint' });
});

test('filtro por sección limita los resultados', () => {
  const outcome = searchEntries(sample, 'herramienta', { section: 'programs' });
  assert.deepEqual(outcome.results.map((item) => item.id).sort(), ['b', 'c']);
  const none = searchEntries(sample, 'servidor', { section: 'programs' });
  assert.equal(none.total, 0);
});

test('la sección de contexto sube resultados sin ocultar los demás', () => {
  const plain = searchEntries(sample, 'plugin', {});
  const contextual = searchEntries(sample, 'plugin servidor', { contextSection: 'games' });
  assert.equal(contextual.status, 'results');
  assert.equal(contextual.results[0].section, 'games');
  assert.ok(plain.total >= 1);
});

test('el total refleja todas las coincidencias aunque el límite recorte la lista', () => {
  const many = Array.from({ length: 40 }, (_, index) =>
    entry({ id: `m${index}`, title: `Proyecto ${index} servidor` }),
  );
  const outcome = searchEntries(many, 'servidor', { limit: 5 });
  assert.equal(outcome.results.length, 5);
  assert.equal(outcome.total, 40);
});
