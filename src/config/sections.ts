import type { Locale } from '../i18n';

/** Identificadores estables de cada sección. Son independientes del idioma. */
export const SECTION_IDS = ['home', 'games', 'programs', 'freelance', 'contact'] as const;
export type SectionId = (typeof SECTION_IDS)[number];

/** Secciones con página de contenido propia (todas excepto la portada). */
export const CONTENT_SECTIONS = ['games', 'programs', 'freelance', 'contact'] as const;
export type ContentSectionId = (typeof CONTENT_SECTIONS)[number];

/** Secciones que aparecen en la navegación principal, en orden. */
export const NAV_SECTIONS = CONTENT_SECTIONS;
export type NavSectionId = (typeof NAV_SECTIONS)[number];

/**
 * Segmento de URL de cada sección por idioma (URLs localizadas).
 * `home` no tiene segmento: es la raíz de cada idioma.
 */
export const SECTION_SLUGS: Record<SectionId, Record<Locale, string>> = {
  home: { es: '', en: '' },
  games: { es: 'juegos', en: 'games' },
  programs: { es: 'programas', en: 'programs' },
  freelance: { es: 'freelance', en: 'freelance' },
  contact: { es: 'contacto', en: 'contact' },
};
