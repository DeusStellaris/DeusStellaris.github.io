import { getAbsoluteLocaleUrl, getRelativeLocaleUrl } from 'astro:i18n';
import { SECTION_SLUGS, type SectionId } from '../config/sections';
import type { Locale } from './index';

/** Ruta sin prefijo de idioma, con barra final. Ej.: '/juegos/' o '/' para la portada. */
export function sectionSegmentPath(section: SectionId, locale: Locale): string {
  const slug = SECTION_SLUGS[section][locale];
  return slug === '' ? '/' : `/${slug}/`;
}

/** URL relativa (con base y prefijo de idioma) de una sección. */
export function sectionHref(section: SectionId, locale: Locale): string {
  return getRelativeLocaleUrl(locale, sectionSegmentPath(section, locale));
}

/** URL absoluta de una sección, para hreflang y metadatos canónicos. */
export function sectionAbsoluteUrl(section: SectionId, locale: Locale): string {
  return getAbsoluteLocaleUrl(locale, sectionSegmentPath(section, locale));
}
