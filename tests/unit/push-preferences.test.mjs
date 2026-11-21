import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  DEFAULT_PREFERENCES,
  followsProject,
  MAX_PROJECTS,
  normalizePreferences,
  withProject,
} from '../../src/features/push/preferences.ts';

const CATEGORIES = ['games', 'programs', 'freelance'];

test('sin dato guardado o con basura, se aplica el opt-in: no se recibe nada', () => {
  for (const raw of [null, undefined, 'texto', 42, []]) {
    assert.deepEqual(normalizePreferences(raw, CATEGORIES), DEFAULT_PREFERENCES);
  }
  assert.equal(DEFAULT_PREFERENCES.mode, 'none');
});

test('un modo desconocido vuelve a "none"', () => {
  assert.equal(normalizePreferences({ mode: 'todo-junto' }, CATEGORIES).mode, 'none');
});

test('conserva las categorías válidas y descarta el resto y los duplicados', () => {
  const result = normalizePreferences(
    { mode: 'categories', categories: ['games', 'games', 'musica', 7, 'freelance'] },
    CATEGORIES,
  );
  assert.deepEqual(result.categories, ['games', 'freelance']);
});

test('los proyectos admiten deusdeck y rechazan slugs con rutas o símbolos', () => {
  const result = normalizePreferences(
    { mode: 'projects', projects: ['deusdeck', '../etc', 'con espacio', '-raro', 'ok_1'] },
    CATEGORIES,
  );
  assert.deepEqual(result.projects, ['deusdeck', 'ok_1']);
});

test('limita la cantidad de proyectos', () => {
  const many = Array.from({ length: MAX_PROJECTS + 10 }, (_, i) => `p${i}`);
  assert.equal(
    normalizePreferences({ mode: 'projects', projects: many }, CATEGORIES).projects.length,
    MAX_PROJECTS,
  );
});

test('seguir un proyecto pasa a "Por proyecto" y conserva las categorías', () => {
  const start = { mode: 'categories', categories: ['games'], projects: [] };
  const next = withProject(start, 'deusdeck', true);
  assert.deepEqual(next, { mode: 'projects', categories: ['games'], projects: ['deusdeck'] });
  assert.equal(followsProject(next, 'deusdeck'), true);
  assert.equal(followsProject(next, 'otro'), false);
});

test('dejar de seguir quita solo ese proyecto y con "Todo" no hay nada que cambiar', () => {
  const projects = { mode: 'projects', categories: [], projects: ['a', 'b'] };
  assert.deepEqual(withProject(projects, 'a', false).projects, ['b']);
  const all = { mode: 'all', categories: [], projects: [] };
  assert.equal(withProject(all, 'a', true), all);
  assert.equal(followsProject(all, 'cualquiera'), true);
});

test('la lista de proyectos seguidos respeta el tope', () => {
  const full = {
    mode: 'projects',
    categories: [],
    projects: Array.from({ length: MAX_PROJECTS }, (_, i) => `p${i}`),
  };
  const next = withProject(full, 'nuevo', true);
  assert.equal(next.projects.length, MAX_PROJECTS);
  assert.equal(next.projects.at(-1), 'nuevo');
});
