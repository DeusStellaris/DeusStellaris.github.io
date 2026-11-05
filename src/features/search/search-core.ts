/**
 * Núcleo del buscador: normalización, puntuación y filtrado.
 *
 * Es lógica pura, sin imports ni efectos: se prueba directamente con Node y se reutiliza
 * desde el buscador de página y desde el asistente. No es una IA: coincidencias de texto
 * ponderadas sobre el índice generado en build.
 */

export type SearchSection = 'home' | 'games' | 'programs' | 'freelance' | 'contact';

export interface SearchEntry {
  id: string;
  type: 'section' | 'project';
  locale: 'es' | 'en';
  title: string;
  summary: string;
  href: string;
  section: SearchSection;
  category: string;
  tags: readonly string[];
}

export interface SearchOptions {
  /** Filtra por sección. Undefined o 'all' no filtra. */
  section?: SearchSection | 'all' | undefined;
  /** Sección de la página actual: sus resultados suben, pero no se ocultan los demás. */
  contextSection?: SearchSection | undefined;
  limit?: number;
}

export type SearchOutcome =
  | { status: 'hint' }
  | { status: 'results'; results: readonly SearchEntry[]; total: number };

const MIN_TOKEN_LENGTH = 2;
const DEFAULT_LIMIT = 30;
const CONTEXT_BONUS = 0.5;

/** Minúsculas, sin acentos y con espacios colapsados. */
export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Mn}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Tokens normalizados de la consulta; descarta los demasiado cortos. */
export function tokenize(query: string): string[] {
  return normalizeText(query)
    .split(' ')
    .filter((token) => token.length >= MIN_TOKEN_LENGTH);
}

interface FieldWeight {
  text: string;
  weight: number;
}

function fieldsOf(entry: SearchEntry): FieldWeight[] {
  return [
    { text: normalizeText(entry.title), weight: 3 },
    { text: normalizeText([entry.category, ...entry.tags].join(' ')), weight: 2 },
    { text: normalizeText(entry.summary), weight: 1 },
  ];
}

/**
 * Puntuación de una entrada para una lista de tokens. Cada token debe aparecer en algún campo;
 * si no, la entrada queda descartada (devuelve 0). Un token cuenta una vez, en el campo más fuerte.
 */
export function scoreEntry(entry: SearchEntry, tokens: readonly string[]): number {
  const fields = fieldsOf(entry);
  let total = 0;
  for (const token of tokens) {
    let best = 0;
    for (const field of fields) {
      if (field.text.includes(token) && field.weight > best) best = field.weight;
    }
    if (best === 0) return 0;
    total += best;
  }
  return total;
}

/** Busca en el índice. Consultas de menos de dos letras devuelven 'hint' sin resultados. */
export function searchEntries(
  entries: readonly SearchEntry[],
  query: string,
  options: SearchOptions = {},
): SearchOutcome {
  const tokens = tokenize(query);
  if (tokens.length === 0) return { status: 'hint' };

  const section = options.section ?? 'all';
  const limit = options.limit ?? DEFAULT_LIMIT;

  const scored: Array<{ entry: SearchEntry; score: number }> = [];
  for (const entry of entries) {
    if (section !== 'all' && entry.section !== section) continue;
    const base = scoreEntry(entry, tokens);
    if (base === 0) continue;
    const bonus =
      options.contextSection !== undefined && entry.section === options.contextSection
        ? CONTEXT_BONUS
        : 0;
    scored.push({ entry, score: base + bonus });
  }

  scored.sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title, 'es'));
  return {
    status: 'results',
    results: scored.slice(0, limit).map((item) => item.entry),
    total: scored.length,
  };
}
