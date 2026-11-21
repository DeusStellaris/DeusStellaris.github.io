/**
 * Modelo puro de las preferencias de notificaciones (sin DOM ni almacenamiento: es lo que prueban
 * los tests unitarios). workers/api/src/push.js valida el mismo formato en el servidor.
 */

export const PUSH_MODES = ['all', 'none', 'categories', 'projects'] as const;
export type PushMode = (typeof PUSH_MODES)[number];

export interface PushPreferences {
  mode: PushMode;
  categories: string[];
  projects: string[];
}

export const MAX_PROJECTS = 50;
const SLUG_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,119}$/;

/** Opt-in: sin decisión del visitante no se recibe nada. */
export const DEFAULT_PREFERENCES: PushPreferences = { mode: 'none', categories: [], projects: [] };

function stringList(value: unknown, accepts: (item: string) => boolean, max: number): string[] {
  if (!Array.isArray(value)) return [];
  const unique = new Set<string>();
  for (const item of value) {
    if (typeof item === 'string' && accepts(item)) unique.add(item);
    if (unique.size >= max) break;
  }
  return [...unique];
}

/** Convierte cualquier valor guardado en preferencias válidas; lo inválido se descarta. */
export function normalizePreferences(
  raw: unknown,
  allowedCategories: readonly string[],
): PushPreferences {
  if (typeof raw !== 'object' || raw === null) return { ...DEFAULT_PREFERENCES };
  const { mode, categories, projects } = raw as Record<string, unknown>;
  return {
    mode: PUSH_MODES.find((candidate) => candidate === mode) ?? DEFAULT_PREFERENCES.mode,
    categories: stringList(
      categories,
      (item) => allowedCategories.includes(item),
      allowedCategories.length,
    ),
    projects: stringList(projects, (item) => SLUG_PATTERN.test(item), MAX_PROJECTS),
  };
}

/** True si los avisos de un proyecto llegan: se sigue todo el sitio o el proyecto está en la lista. */
export function followsProject(preferences: PushPreferences, slug: string): boolean {
  return (
    preferences.mode === 'all' ||
    (preferences.mode === 'projects' && preferences.projects.includes(slug))
  );
}

/**
 * Sigue o deja de seguir un proyecto puntual. Con "Todo" activo no hay nada que cambiar; desde
 * "Nada" o "Por categoría" se pasa a "Por proyecto" (las categorías guardadas se conservan).
 */
export function withProject(
  preferences: PushPreferences,
  slug: string,
  follow: boolean,
): PushPreferences {
  if (preferences.mode === 'all') return preferences;
  const others = preferences.projects.filter((item) => item !== slug);
  const projects = follow ? [...others, slug].slice(-MAX_PROJECTS) : others;
  return { ...preferences, mode: 'projects', projects };
}
