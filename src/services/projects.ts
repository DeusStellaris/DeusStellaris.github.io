import { type CollectionEntry, getCollection, getEntry } from 'astro:content';
import type { ContentSectionId } from '../config/sections';
import { LOCALES, type Locale } from '../i18n';

/**
 * Acceso a proyectos publicados. Única capa que decide qué contenido es visible.
 *
 * Reglas:
 * - Solo se muestra contenido con status 'published'.
 * - Para un idioma se usa su versión si está publicada; si no, la versión en español.
 * - Los proyectos se ordenan por published_at, de más reciente a más antiguo.
 */

export type ProjectEntry = CollectionEntry<'projects'>;

export interface ProjectSummary {
  slug: string;
  /** Versión a mostrar en el idioma pedido (puede ser la española como fallback). */
  entry: ProjectEntry;
  /** Idioma real de `entry`. Útil para marcar el fallback. */
  sourceLocale: Locale;
}

/** Descompone el id de Astro ('es/mi-proyecto') en idioma y slug. Ignora ids no válidos. */
function parseProjectId(id: string): { locale: Locale; slug: string } | null {
  const [folder, ...rest] = id.split('/');
  const slug = rest.join('/');
  if (!folder || !slug || !(LOCALES as readonly string[]).includes(folder)) return null;
  return { locale: folder as Locale, slug };
}

type ProjectsBySlug = Map<string, Partial<Record<Locale, ProjectEntry>>>;

async function indexProjects(): Promise<ProjectsBySlug> {
  const index: ProjectsBySlug = new Map();
  for (const entry of await getCollection('projects')) {
    const parsed = parseProjectId(entry.id);
    if (!parsed) continue;
    const versions = index.get(parsed.slug) ?? {};
    versions[parsed.locale] = entry;
    index.set(parsed.slug, versions);
  }
  return index;
}

function isPublished(entry: ProjectEntry | undefined): entry is ProjectEntry {
  return entry?.data.status === 'published';
}

/** Versión publicada para un idioma, con fallback al español. Undefined si no hay ninguna. */
function pickVersion(
  versions: Partial<Record<Locale, ProjectEntry>>,
  locale: Locale,
): { entry: ProjectEntry; sourceLocale: Locale } | undefined {
  const own = versions[locale];
  if (isPublished(own)) return { entry: own, sourceLocale: locale };
  const spanish = versions.es;
  if (locale !== 'es' && isPublished(spanish)) return { entry: spanish, sourceLocale: 'es' };
  return undefined;
}

function byPublishedDesc(a: ProjectSummary, b: ProjectSummary): number {
  return b.entry.data.published_at.getTime() - a.entry.data.published_at.getTime();
}

/** Proyectos visibles en un idioma, más recientes primero. Opcionalmente filtrados por sección. */
export async function listProjects(
  locale: Locale,
  options: { section?: ContentSectionId; limit?: number } = {},
): Promise<ProjectSummary[]> {
  const index = await indexProjects();
  const summaries: ProjectSummary[] = [];
  for (const [slug, versions] of index) {
    const picked = pickVersion(versions, locale);
    if (!picked) continue;
    if (options.section && picked.entry.data.section !== options.section) continue;
    summaries.push({ slug, ...picked });
  }
  summaries.sort(byPublishedDesc);
  return options.limit === undefined ? summaries : summaries.slice(0, options.limit);
}

/** Idiomas en los que existe una página de un proyecto (para hreflang y el selector). */
export async function projectLocales(slug: string): Promise<Locale[]> {
  const index = await indexProjects();
  const versions = index.get(slug);
  if (!versions) return [];
  return LOCALES.filter((locale) => pickVersion(versions, locale) !== undefined);
}

/** Nombre legible de una categoría en el idioma pedido; cae al español si falta la traducción. */
export async function getCategoryLabel(
  categoryRef: ProjectEntry['data']['category'],
  locale: Locale,
): Promise<string | undefined> {
  if (!categoryRef) return undefined;
  const category = await getEntry('categories', categoryRef.id);
  if (!category) return undefined;
  if (locale === 'en' && category.data.label_en) return category.data.label_en;
  return category.data.label;
}

/** Colaboradores de un proyecto. Una referencia rota ya falla durante el build. */
export async function getProjectCollaborators(entry: ProjectEntry) {
  const collaborators = await Promise.all(
    entry.data.collaborators.map((ref) => getEntry('collaborators', ref.id)),
  );
  return collaborators.filter((item) => item !== undefined);
}
