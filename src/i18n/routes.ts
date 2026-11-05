import { getAbsoluteLocaleUrl, getRelativeLocaleUrl } from 'astro:i18n';
import { SECTION_SLUGS, type SectionId } from '../config/sections';
import { LOCALES, type Locale } from './index';

/** Segmento de URL de la sección de proyectos (detalle), por idioma. */
export const PROJECT_SEGMENT: Record<Locale, string> = { es: 'proyectos', en: 'projects' };

/** Ruta sin prefijo de idioma, con barra final. Ej.: '/juegos/' o '/' para la portada. */
export function sectionSegmentPath(section: SectionId, locale: Locale): string {
  const slug = SECTION_SLUGS[section][locale];
  return slug === '' ? '/' : `/${slug}/`;
}

/** Segmentos de URL de las páginas de búsqueda y de ranking, por idioma. */
export const SEARCH_SEGMENT: Record<Locale, string> = { es: 'buscar', en: 'search' };
export const RANKING_SEGMENT: Record<Locale, string> = { es: 'ranking', en: 'rankings' };

/** Ruta sin prefijo de un proyecto. */
export function projectSegmentPath(slug: string, locale: Locale): string {
  return `/${PROJECT_SEGMENT[locale]}/${slug}/`;
}

/** Rutas de una sección en todos los idiomas. */
export function sectionPaths(section: SectionId): Record<Locale, string> {
  return {
    es: sectionSegmentPath(section, 'es'),
    en: sectionSegmentPath(section, 'en'),
  };
}

/** URL relativa (con base y prefijo de idioma) de una ruta sin prefijo. */
export function localizedHref(locale: Locale, path: string): string {
  return getRelativeLocaleUrl(locale, path);
}

/** URL absoluta de una ruta sin prefijo, para canonical y hreflang. */
export function absoluteLocalizedUrl(locale: Locale, path: string): string {
  return getAbsoluteLocaleUrl(locale, path);
}

/** Enlaces del selector de idioma: la página equivalente, o la portada si no existe. */
export function switchTargets(paths: Partial<Record<Locale, string>>): Record<Locale, string> {
  return Object.fromEntries(
    LOCALES.map((locale) => [locale, localizedHref(locale, paths[locale] ?? '/')]),
  ) as Record<Locale, string>;
}

/** Atajo: URL relativa de una sección en un idioma. */
export function sectionHref(section: SectionId, locale: Locale): string {
  return localizedHref(locale, sectionSegmentPath(section, locale));
}

/** Rutas de un proyecto en los idiomas en que existe su página. */
export function projectPagePaths(
  slug: string,
  available: readonly Locale[],
): Partial<Record<Locale, string>> {
  return Object.fromEntries(available.map((locale) => [locale, projectSegmentPath(slug, locale)]));
}

/** Segmentos de URL de los documentos legales, por idioma. */
export const LEGAL_SEGMENT: Record<'terms' | 'privacy' | 'cookies', Record<Locale, string>> = {
  terms: { es: 'terminos', en: 'terms' },
  privacy: { es: 'privacidad', en: 'privacy' },
  cookies: { es: 'cookies', en: 'cookies' },
};
