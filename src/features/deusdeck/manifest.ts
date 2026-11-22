/**
 * Manifiesto de versión de DeusDeck (public/programas/deusdeck/version.json): validación y formato puros,
 * sin DOM, para poder testearlos. La firma Ed25519 la verifica la app; el sitio solo muestra los datos.
 */

export const PLATFORMS = ['windows', 'android'] as const;
export type Platform = (typeof PLATFORMS)[number];
export const NOTE_GROUPS = ['added', 'improved', 'fixed'] as const;
export type NoteGroup = (typeof NOTE_GROUPS)[number];

export interface PlatformEntry {
  url: string;
  sha256: string;
}

export interface Manifest {
  version: string;
  windows: PlatformEntry;
  android: PlatformEntry;
  notes: Record<'es' | 'en', Partial<Record<NoteGroup, string[]>>>;
}

const SHA256 = /^[0-9a-f]{64}$/;
const VERSION = /^\d+\.\d+\.\d+$/;
const SITE_PREFIX = '/programas/deusdeck/';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseEntry(raw: unknown): PlatformEntry | null {
  if (!isRecord(raw) || typeof raw.url !== 'string' || typeof raw.sha256 !== 'string') return null;
  if (!SHA256.test(raw.sha256)) return null;
  try {
    if (new URL(raw.url).protocol !== 'https:') return null;
  } catch {
    return null;
  }
  return { url: raw.url, sha256: raw.sha256 };
}

function parseNotes(raw: unknown): Partial<Record<NoteGroup, string[]>> {
  const notes: Partial<Record<NoteGroup, string[]>> = {};
  if (!isRecord(raw)) return notes;
  for (const group of NOTE_GROUPS) {
    const items = raw[group];
    if (Array.isArray(items))
      notes[group] = items.filter((i): i is string => typeof i === 'string');
  }
  return notes;
}

/** Devuelve el manifiesto validado o null si falta algo o el formato no es el esperado. */
export function parseManifest(raw: unknown): Manifest | null {
  if (!isRecord(raw) || typeof raw.version !== 'string' || !VERSION.test(raw.version)) return null;
  const windows = parseEntry(raw.windows);
  const android = parseEntry(raw.android);
  if (!windows || !android) return null;
  const notes = isRecord(raw.notes) ? raw.notes : {};
  return {
    version: raw.version,
    windows,
    android,
    notes: { es: parseNotes(notes.es), en: parseNotes(notes.en) },
  };
}

/** Las descargas alojadas en este mismo sitio se sirven desde el origen actual (vista previa incluida); las externas no cambian. */
export function resolveDownloadUrl(url: string, origin: string): string {
  const parsed = new URL(url);
  return parsed.pathname.startsWith(SITE_PREFIX) ? `${origin}${parsed.pathname}` : url;
}

export function formatSize(bytes: number, locale: string): string {
  const mib = bytes / 1024 ** 2;
  return `${mib.toLocaleString(locale, { maximumFractionDigits: 1 })} MiB`;
}
