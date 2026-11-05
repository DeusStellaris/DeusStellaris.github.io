import type { SearchEntry, SearchSection } from './search-core';

/**
 * Carga del índice en el navegador. El JSON se trata como entrada externa: se valida su forma
 * antes de usarlo, y un fallo no queda cacheado para que el reintento sea posible.
 */

const SECTIONS: readonly SearchSection[] = ['home', 'games', 'programs', 'freelance', 'contact'];
const LOCALES: readonly string[] = ['es', 'en'];

let cached: Promise<SearchEntry[]> | null = null;

function isSearchEntry(value: unknown): value is SearchEntry {
  if (typeof value !== 'object' || value === null) return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.id === 'string' &&
    (entry.type === 'section' || entry.type === 'project') &&
    typeof entry.locale === 'string' &&
    LOCALES.includes(entry.locale) &&
    typeof entry.title === 'string' &&
    typeof entry.summary === 'string' &&
    typeof entry.href === 'string' &&
    entry.href.startsWith('/') &&
    typeof entry.section === 'string' &&
    SECTIONS.includes(entry.section as SearchSection) &&
    typeof entry.category === 'string' &&
    Array.isArray(entry.tags) &&
    entry.tags.every((tag) => typeof tag === 'string')
  );
}

async function fetchIndex(): Promise<SearchEntry[]> {
  const response = await fetch(`${import.meta.env.BASE_URL}search-index.json`, {
    credentials: 'omit',
    cache: 'default',
  });
  if (!response.ok) throw new Error('search_index_http');

  const body: unknown = await response.json();
  if (typeof body !== 'object' || body === null) throw new Error('search_index_shape');
  const { version, entries } = body as { version?: unknown; entries?: unknown };
  if (version !== 1 || !Array.isArray(entries)) throw new Error('search_index_shape');

  return entries.filter(isSearchEntry);
}

/** Índice cacheado en memoria para la sesión de la página. Un fallo se descarta para permitir reintentar. */
export function loadSearchIndex(): Promise<SearchEntry[]> {
  if (!cached) {
    cached = fetchIndex().catch((error: unknown) => {
      cached = null;
      throw error;
    });
  }
  return cached;
}
