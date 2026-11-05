import type { ContentSectionId } from '../config/sections';
import { type Locale, type TranslationKey, t } from './index';

// Claves explícitas por sección: el tipo garantiza que existan en el diccionario.
const COPY_KEYS: Record<ContentSectionId, { title: TranslationKey; intro: TranslationKey }> = {
  games: { title: 'sections.games.title', intro: 'sections.games.intro' },
  programs: { title: 'sections.programs.title', intro: 'sections.programs.intro' },
  freelance: { title: 'sections.freelance.title', intro: 'sections.freelance.intro' },
  contact: { title: 'sections.contact.title', intro: 'sections.contact.intro' },
};

/** Título y descripción localizados de una sección de contenido. */
export function sectionCopy(
  locale: Locale,
  section: ContentSectionId,
): { title: string; intro: string } {
  const keys = COPY_KEYS[section];
  return { title: t(locale, keys.title), intro: t(locale, keys.intro) };
}
