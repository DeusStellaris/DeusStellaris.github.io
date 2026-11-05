import type { Locale } from '../i18n';

const INTL_LOCALES: Record<Locale, string> = { es: 'es-AR', en: 'en-US' };

/** Fecha legible en el idioma indicado. UTC fijo para que el build sea reproducible. */
export function formatDate(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(INTL_LOCALES[locale], {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}
