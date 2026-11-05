import en from './en';
import es, { type Dictionary } from './es';

export const LOCALES = ['es', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

/** Nombre de cada idioma escrito en ese mismo idioma (para el selector). */
export const LOCALE_NAMES: Record<Locale, string> = { es: 'Español', en: 'English' };

export const DEFAULT_LOCALE: Locale = 'es';

const dictionaries: Record<Locale, Partial<Dictionary>> = { es, en };

/** Todas las rutas hoja del diccionario en notación con puntos, p. ej. 'nav.home'. */
type Leaves<T, Prefix extends string = ''> = T extends string
  ? Prefix
  : {
      [K in keyof T & string]: Leaves<T[K], Prefix extends '' ? K : `${Prefix}.${K}`>;
    }[keyof T & string];

export type TranslationKey = Leaves<Dictionary>;

function lookup(dictionary: unknown, key: string): string | undefined {
  let node: unknown = dictionary;
  for (const part of key.split('.')) {
    if (typeof node !== 'object' || node === null) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === 'string' ? node : undefined;
}

/**
 * Devuelve el texto de la interfaz en el idioma pedido.
 * Si falta en ese idioma, usa el español. Nunca devuelve cadenas vacías
 * ni la clave: si el español también falta, es un error de desarrollo y se lanza.
 */
export function t(locale: Locale, key: TranslationKey): string {
  const value = lookup(dictionaries[locale], key) ?? lookup(es, key);
  if (value === undefined) {
    throw new Error(`Clave de traducción inexistente: ${key}`);
  }
  return value;
}

/** Idioma válido a partir de una cadena cualquiera; usa el predeterminado si no lo es. */
export function resolveLocale(value: string | undefined): Locale {
  return value === 'en' ? 'en' : DEFAULT_LOCALE;
}
