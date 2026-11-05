import { SECTION_IDS, type SectionId } from '../config/sections';
import type { SearchEntry, SearchSection } from '../features/search/search-core';
import { LOCALES, t } from '../i18n';
import { localizedHref, projectSegmentPath, sectionHref } from '../i18n/routes';
import { sectionCopy } from '../i18n/section-copy';
import { getCategoryLabel, listProjects } from './projects';

/**
 * Construye el índice de búsqueda en build: secciones, portada y proyectos publicados,
 * en ambos idiomas. Usa los mismos servicios que las páginas, así que nunca indexa
 * contenido que no se publica.
 */

const CONTENT_SECTIONS_FOR_INDEX = SECTION_IDS.filter((id): id is SectionId => id !== 'home');

export async function buildSearchEntries(): Promise<SearchEntry[]> {
  const entries: SearchEntry[] = [];

  for (const locale of LOCALES) {
    entries.push({
      id: `home:${locale}`,
      type: 'section',
      locale,
      title: t(locale, 'sections.home.title'),
      summary: t(locale, 'sections.home.subtitle'),
      href: localizedHref(locale, '/'),
      section: 'home',
      category: '',
      tags: [],
    });

    for (const section of CONTENT_SECTIONS_FOR_INDEX) {
      const copy = sectionCopy(locale, section as Exclude<SectionId, 'home'>);
      entries.push({
        id: `section:${section}:${locale}`,
        type: 'section',
        locale,
        title: copy.title,
        summary: copy.intro,
        href: sectionHref(section, locale),
        section: section as SearchSection,
        category: '',
        tags: [],
      });
    }

    for (const project of await listProjects(locale)) {
      const data = project.entry.data;
      entries.push({
        id: `project:${project.slug}:${locale}`,
        type: 'project',
        locale,
        title: data.title,
        summary: data.summary,
        href: localizedHref(locale, projectSegmentPath(project.slug, locale)),
        section: data.section,
        category: (await getCategoryLabel(data.category, locale)) ?? '',
        tags: data.tags,
      });
    }
  }

  return entries;
}
