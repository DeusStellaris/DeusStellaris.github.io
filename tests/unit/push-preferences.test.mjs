import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  DEFAULT_PREFERENCES,
  MAX_PROJECTS,
  normalizePreferences,
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
