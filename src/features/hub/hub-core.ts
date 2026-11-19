/**
 * Núcleo del DeusDeck Hub, sin DOM: valida el catálogo, filtra por categoría y busca por texto.
 * El catálogo viene de hub-resources.json; todo lo que no cumple la forma se descarta, así un
 * recurso mal formado nunca llega a pintarse.
 */

export const HUB_CATEGORIES = ['themes', 'icons', 'emoji', 'plugins'] as const;
export type HubCategory = (typeof HUB_CATEGORIES)[number];

type Localized = { es: string; en: string };

export interface HubResource {
  id: string;
  category: HubCategory;
  name: Localized;
  description: Localized;
  author: string;
  version: string;
  /** Versión mínima de DeusDeck con la que funciona el recurso. */
  minAppVersion: string;
  /** Ruta del sitio (`/...`) o URL https. Null si no hay vista previa. */
  previewUrl: string | null;
  /** Descarga directa (ruta del sitio o https). Null si todavía no hay archivo. */
  downloadUrl: string | null;
  /** Si la app de escritorio puede instalarlo con el protocolo deusdeck://. */
  installable: boolean;
}

export type Locale = 'es' | 'en';
export interface HubFilter {
  category: HubCategory | 'all';
  query: string;
  locale: Locale;
}

const ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/;
const VERSION_PATTERN = /^\d{1,3}(\.\d{1,3}){0,2}$/;

function text(value: unknown, max: number): string | null {
  return typeof value === 'string' && value.trim() !== '' && value.length <= max
    ? value.trim()
    : null;
}

function localized(value: unknown, max: number): Localized | null {
  if (typeof value !== 'object' || value === null) return null;
  const { es, en } = value as Record<string, unknown>;
  const spanish = text(es, max);
  const english = text(en, max);
  return spanish && english ? { es: spanish, en: english } : null;
}

/** Acepta rutas del propio sitio o URLs https; rechaza cualquier otro esquema (javascript:, data:, http:). */
export function safeUrl(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 500) return null;
  if (value.startsWith('/') && !value.startsWith('//') && !value.includes('\\')) return value;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.username === '' ? url.href : null;
  } catch {
    return null;
  }
}

function normalizeResource(raw: unknown): HubResource | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const item = raw as Record<string, unknown>;
  const id = typeof item.id === 'string' && ID_PATTERN.test(item.id) ? item.id : null;
  const category = HUB_CATEGORIES.find((candidate) => candidate === item.category);
  const name = localized(item.name, 80);
  const description = localized(item.description, 600);
  const author = text(item.author, 60);
  const version =
    typeof item.version === 'string' && VERSION_PATTERN.test(item.version) ? item.version : null;
  const minApp =
    typeof item.minAppVersion === 'string' && VERSION_PATTERN.test(item.minAppVersion)
      ? item.minAppVersion
      : null;
  if (!id || !category || !name || !description || !author || !version || !minApp) return null;

  return {
    id,
    category,
    name,
    description,
    author,
    version,
    minAppVersion: minApp,
    previewUrl: safeUrl(item.previewUrl),
    downloadUrl: safeUrl(item.downloadUrl),
    installable: item.installable === true,
  };
}

/** Recursos válidos del catálogo, sin repetir ids. */
export function normalizeResources(raw: unknown): HubResource[] {
  const list = (raw as { resources?: unknown } | null)?.resources;
  if (!Array.isArray(list)) return [];
  const seen = new Set<string>();
  const resources: HubResource[] = [];
  for (const entry of list) {
    const resource = normalizeResource(entry);
    if (!resource || seen.has(resource.id)) continue;
    seen.add(resource.id);
    resources.push(resource);
  }
  return resources;
}

/** Minúsculas y sin tildes, para que «ícono» encuentre «icono». */
export function fold(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
}

export function filterResources(resources: HubResource[], filter: HubFilter): HubResource[] {
  const terms = fold(filter.query).split(/\s+/).filter(Boolean);
  return resources.filter((resource) => {
    if (filter.category !== 'all' && resource.category !== filter.category) return false;
    if (terms.length === 0) return true;
    const haystack = fold(
      `${resource.name[filter.locale]} ${resource.description[filter.locale]} ${resource.author}`,
    );
    return terms.every((term) => haystack.includes(term));
  });
}

/** Enlace del protocolo que abre la app de escritorio para instalar un recurso. */
export function installUrl(id: string): string {
  return `deusdeck://install?id=${encodeURIComponent(id)}`;
}
